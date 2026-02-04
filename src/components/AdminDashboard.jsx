import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, Button, List, Typography, Card, message, Popconfirm, Tag as AntTag, Input } from 'antd';
import { UploadCloud, Trash2, FileJson, RefreshCw, Home, FileQuestion, Lock, Wrench } from 'lucide-react'; // Added Wrench icon
import { getAllFlashcards, saveFlashcardSet, deleteFlashcardSet } from '../firebase/flashcardService';
import { getAllQuizzes, saveQuizSet, deleteQuizSet } from '../firebase/quizService';
import { getAllRepairs, saveRepairSet, deleteRepairSet } from '../firebase/repairService'; // Import new service

const { Title, Text } = Typography;

const AdminDashboard = () => {
  const navigate = useNavigate();
  
  // --- AUTH STATE ---
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passcode, setPasscode] = useState('');

  // --- DATA STATE ---
  const [loading, setLoading] = useState(false);
  const [flashcards, setFlashcards] = useState([]);
  const [quizzes, setQuizzes] = useState([]);
  const [repairs, setRepairs] = useState([]); // New state
  const processingFiles = useRef(0);

  useEffect(() => {
    if (isAuthenticated) {
      fetchAllData();
    }
  }, [isAuthenticated]);

  const handleLogin = () => {
    if (passcode === '2000') {
      setIsAuthenticated(true);
      message.success("Access Granted");
    } else {
      message.error("Incorrect Passcode");
    }
  };

  const fetchAllData = () => {
    fetchFlashcards();
    fetchQuizzes();
    fetchRepairs();
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

  const fetchRepairs = async () => {
    setLoading(true);
    const data = await getAllRepairs();
    setRepairs(data);
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
        
        if (!json.id || !json.questions) {
          message.error(`File ${file.name}: Invalid JSON. Must contain 'id' and 'questions'.`);
        } else {
          let result;
          if (type === 'flashcard') result = await saveFlashcardSet(json);
          else if (type === 'quiz') result = await saveQuizSet(json);
          else if (type === 'repair') result = await saveRepairSet(json); // Handle new type

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
          else if (type === 'quiz') fetchQuizzes();
          else if (type === 'repair') fetchRepairs();
        }
      }
    };
    reader.readAsText(file);
    return false;
  };

  const handleDelete = async (id, type) => {
    try {
      setLoading(true);
      if (type === 'flashcard') {
        await deleteFlashcardSet(id);
        fetchFlashcards();
      } else if (type === 'quiz') {
        await deleteQuizSet(id);
        fetchQuizzes();
      } else if (type === 'repair') {
        await deleteRepairSet(id);
        fetchRepairs();
      }
      message.success("Item deleted");
    } catch (err) {
      message.error("Failed to delete");
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f0f2f5' }}>
        <Card style={{ width: 350, textAlign: 'center' }}>
          <div style={{ marginBottom: 20 }}>
            <Lock size={40} color="#1890ff" />
            <Title level={3} style={{ marginTop: 10 }}>Admin Access</Title>
          </div>
          <Input.Password 
            placeholder="Enter Passcode" 
            size="large"
            style={{ marginBottom: 20 }}
            value={passcode}
            onChange={(e) => setPasscode(e.target.value)}
            onPressEnter={handleLogin}
          />
          <Button type="primary" block size="large" onClick={handleLogin}>Unlock</Button>
          <Button type="link" onClick={() => navigate('/')} style={{ marginTop: 10 }}>Back to Home</Button>
        </Card>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 900, margin: '40px auto', padding: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 30 }}>
        <Title level={2} style={{ margin: 0 }}>Content Management</Title>
        <Button icon={<Home size={16} />} onClick={() => navigate('/')}>Back to Home</Button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 30 }}>
        
        {/* REPAIR SECTION (New) */}
        <Card title="Repair (Sentence Building)" extra={<Button icon={<RefreshCw size={16}/>} onClick={fetchRepairs} loading={loading}>Refresh</Button>}>
          <div style={{ marginBottom: 20, padding: 20, border: '1px dashed #d9d9d9', borderRadius: 8, background: '#fafafa' }}>
             <Upload.Dragger 
              accept=".json" 
              multiple={true}
              showUploadList={false} 
              beforeUpload={(file) => handleImport(file, 'repair')}
            >
              <p className="ant-upload-drag-icon"><UploadCloud size={32} color="#722ed1" /></p>
              <p className="ant-upload-text">Import Repair Sets (JSON)</p>
            </Upload.Dragger>
          </div>
          <List
            loading={loading}
            dataSource={repairs}
            pagination={{ pageSize: 5 }}
            renderItem={(item) => (
              <List.Item actions={[
                  <Popconfirm title="Delete?" onConfirm={() => handleDelete(item.id, 'repair')} okText="Yes" cancelText="No">
                    <Button danger type="text" icon={<Trash2 size={16} />} />
                  </Popconfirm>
                ]}>
                <List.Item.Meta
                  avatar={<Wrench color="#722ed1" size={24} />}
                  title={<span>{item.title} <Text type="secondary" style={{fontSize:'0.8em'}}>({item.id})</Text></span>}
                  description={
                    <>
                      {/* Subject Tag */}
                      <AntTag color="purple">{item.subject || 'No Subject'}</AntTag>
                      
                      {/* New Tags Loop */}
                      {item.tags && item.tags.map((tag, i) => (
                        <AntTag key={i} style={{ marginTop: 4 }}>{tag}</AntTag>
                      ))}
                    </>
                  }
                />
              </List.Item>
            )}
          />
        </Card>
        
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