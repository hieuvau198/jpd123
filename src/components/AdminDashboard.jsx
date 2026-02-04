import React, { useState, useEffect, useRef } from 'react';
import { Upload, Button, List, Typography, Card, message, Popconfirm, Tag as AntTag, Tabs } from 'antd';
import { UploadCloud, Trash2, FileJson, RefreshCw, Home, FileQuestion } from 'lucide-react';
import { getAllFlashcards, saveFlashcardSet, deleteFlashcardSet } from '../firebase/flashcardService';
import { getAllQuizzes, saveQuizSet, deleteQuizSet } from '../firebase/quizService';

const { Title, Text } = Typography;

const AdminDashboard = ({ onBack }) => {
  const [loading, setLoading] = useState(false);
  const [flashcards, setFlashcards] = useState([]);
  const [quizzes, setQuizzes] = useState([]);
  const processingFiles = useRef(0);

  // Fetch data on mount
  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = () => {
    fetchFlashcards();
    fetchQuizzes();
  };

  const fetchFlashcards = async () => {
    setLoading(true);
    const data = await getAllFlashcards();
    setFlashcards(data);
    setLoading(false);
  };

  const fetchQuizzes = async () => {
    setLoading(true);
    const data = await getAllQuizzes();
    setQuizzes(data);
    setLoading(false);
  };

  // Generic File Upload Handler
  const handleImport = (file, type) => {
    processingFiles.current += 1;
    setLoading(true);

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const json = JSON.parse(e.target.result);
        
        // Validation
        if (!json.id || !json.questions) {
          message.error(`File ${file.name}: Invalid JSON. Must contain 'id' and 'questions'.`);
        } else {
          let result;
          if (type === 'flashcard') {
            result = await saveFlashcardSet(json);
          } else {
            result = await saveQuizSet(json);
          }

          if (result.success) {
            message.success(`Imported: ${json.title || file.name}`);
          } else {
            message.warning(`Skipped ${file.name}: ${result.message}`);
          }
        }
      } catch (err) {
        message.error(`Error processing ${file.name}: ` + err.message);
      } finally {
        processingFiles.current -= 1;
        if (processingFiles.current === 0) {
          if (type === 'flashcard') fetchFlashcards();
          else fetchQuizzes();
        }
      }
    };
    reader.readAsText(file);
    return false; // Prevent default upload
  };

  // Delete Handlers
  const handleDeleteFlashcard = async (id) => {
    try {
      setLoading(true);
      await deleteFlashcardSet(id);
      message.success("Flashcard set deleted");
      fetchFlashcards();
    } catch (err) {
      message.error("Failed to delete");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteQuiz = async (id) => {
    try {
      setLoading(true);
      await deleteQuizSet(id);
      message.success("Quiz set deleted");
      fetchQuizzes();
    } catch (err) {
      message.error("Failed to delete");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 900, margin: '40px auto', padding: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 30 }}>
        <Title level={2} style={{ margin: 0 }}>Content Management</Title>
        <Button icon={<Home size={16} />} onClick={onBack}>Back to Home</Button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 30 }}>
        
        {/* FLASHCARD SECTION */}
        <Card title="Flashcards" extra={<Button icon={<RefreshCw size={16}/>} onClick={fetchFlashcards} loading={loading}>Refresh</Button>}>
          <div style={{ marginBottom: 20, padding: 20, border: '1px dashed #d9d9d9', borderRadius: 8, background: '#fafafa' }}>
             <Upload.Dragger 
              accept=".json" 
              multiple={true}
              showUploadList={false} 
              beforeUpload={(file) => handleImport(file, 'flashcard')}
            >
              <p className="ant-upload-drag-icon"><UploadCloud size={32} color="#1890ff" /></p>
              <p className="ant-upload-text">Import Flashcards (JSON)</p>
              <p className="ant-upload-hint">Ignores if ID already exists.</p>
            </Upload.Dragger>
          </div>

          <List
            loading={loading}
            dataSource={flashcards}
            pagination={{ pageSize: 5 }}
            renderItem={(item) => (
              <List.Item
                actions={[
                  <Popconfirm title="Delete?" onConfirm={() => handleDeleteFlashcard(item.id)} okText="Yes" cancelText="No">
                    <Button danger type="text" icon={<Trash2 size={16} />} />
                  </Popconfirm>
                ]}
              >
                <List.Item.Meta
                  avatar={<FileJson color="#faad14" size={24} />}
                  title={<span>{item.title} <Text type="secondary" style={{fontSize:'0.8em'}}>({item.id})</Text></span>}
                  description={<AntTag color="blue">{item.subject || 'No Subject'}</AntTag>}
                />
              </List.Item>
            )}
          />
        </Card>

        {/* QUIZ SECTION */}
        <Card title="Quizzes" extra={<Button icon={<RefreshCw size={16}/>} onClick={fetchQuizzes} loading={loading}>Refresh</Button>}>
          <div style={{ marginBottom: 20, padding: 20, border: '1px dashed #d9d9d9', borderRadius: 8, background: '#fafafa' }}>
             <Upload.Dragger 
              accept=".json" 
              multiple={true}
              showUploadList={false} 
              beforeUpload={(file) => handleImport(file, 'quiz')}
            >
              <p className="ant-upload-drag-icon"><UploadCloud size={32} color="#52c41a" /></p>
              <p className="ant-upload-text">Import Quizzes (JSON)</p>
              <p className="ant-upload-hint">Ignores if ID already exists.</p>
            </Upload.Dragger>
          </div>

          <List
            loading={loading}
            dataSource={quizzes}
            pagination={{ pageSize: 5 }}
            renderItem={(item) => (
              <List.Item
                actions={[
                  <Popconfirm title="Delete?" onConfirm={() => handleDeleteQuiz(item.id)} okText="Yes" cancelText="No">
                    <Button danger type="text" icon={<Trash2 size={16} />} />
                  </Popconfirm>
                ]}
              >
                <List.Item.Meta
                  avatar={<FileQuestion color="#52c41a" size={24} />}
                  title={<span>{item.title} <Text type="secondary" style={{fontSize:'0.8em'}}>({item.id})</Text></span>}
                  description={<AntTag color="green">{item.subject || 'No Subject'}</AntTag>}
                />
              </List.Item>
            )}
          />
        </Card>

      </div>
    </div>
  );
};

export default AdminDashboard;