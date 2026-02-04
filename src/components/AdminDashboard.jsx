import React, { useState, useEffect } from 'react';
import { Upload, Button, List, Typography, Card, message, Popconfirm, Tag as AntTag } from 'antd';
import { UploadCloud, Trash2, FileJson, RefreshCw, Home } from 'lucide-react';
import { getAllFlashcards, saveFlashcardSet, deleteFlashcardSet } from '../firebase/flashcardService';

const { Title, Text } = Typography;

const AdminDashboard = ({ onBack }) => {
  const [loading, setLoading] = useState(false);
  const [flashcards, setFlashcards] = useState([]);

  // Fetch data on mount
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    const data = await getAllFlashcards();
    setFlashcards(data);
    setLoading(false);
  };

  // Handle File Upload
  const handleFileUpload = (file) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const json = JSON.parse(e.target.result);
        
        // Basic validation
        if (!json.id || !json.questions) {
          message.error("Invalid JSON format. Must contain 'id' and 'questions'.");
          return;
        }

        setLoading(true);
        await saveFlashcardSet(json);
        message.success(`Successfully imported: ${json.title}`);
        fetchData(); // Refresh list
      } catch (err) {
        message.error("Error parsing or saving file: " + err.message);
      } finally {
        setLoading(false);
      }
    };
    reader.readAsText(file);
    return false; // Prevent default upload behavior
  };

  // Handle Delete
  const handleDelete = async (id) => {
    try {
      setLoading(true);
      await deleteFlashcardSet(id);
      message.success("Deleted successfully");
      fetchData();
    } catch (err) {
      message.error("Failed to delete");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 800, margin: '40px auto', padding: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 30 }}>
        <Title level={2} style={{ margin: 0 }}>Flashcard Management</Title>
        <Button icon={<Home size={16} />} onClick={onBack}>Back to Home</Button>
      </div>

      {/* Import Section */}
      <Card title="Import Flashcard JSON" style={{ marginBottom: 30 }}>
        <Upload.Dragger 
          accept=".json" 
          showUploadList={false} 
          beforeUpload={handleFileUpload}
        >
          <p className="ant-upload-drag-icon">
            <UploadCloud size={48} color="#1890ff" />
          </p>
          <p className="ant-upload-text">Click or drag JSON file to this area to upload</p>
          <p className="ant-upload-hint">
            Supports single JSON file import. The file must strictly follow the App's flashcard format.
          </p>
        </Upload.Dragger>
      </Card>

      {/* List Section */}
      <Card 
        title="Current Flashcards in Firebase" 
        extra={<Button icon={<RefreshCw size={16}/>} onClick={fetchData} loading={loading}>Refresh</Button>}
      >
        <List
          loading={loading}
          itemLayout="horizontal"
          dataSource={flashcards}
          renderItem={(item) => (
            <List.Item
              actions={[
                <Popconfirm
                  title="Delete this set?"
                  description="This action cannot be undone."
                  onConfirm={() => handleDelete(item.id)}
                  okText="Yes"
                  cancelText="No"
                >
                  <Button danger type="text" icon={<Trash2 size={16} />} />
                </Popconfirm>
              ]}
            >
              <List.Item.Meta
                avatar={<FileJson color="#faad14" size={24} />}
                title={<span>{item.title} <Text type="secondary" style={{fontSize:'0.8em'}}>({item.id})</Text></span>}
                description={
                    <div>
                        <AntTag color="blue">{item.subject || 'No Subject'}</AntTag>
                        <Text type="secondary">{item.questions?.length || 0} questions</Text>
                    </div>
                }
              />
            </List.Item>
          )}
        />
      </Card>
    </div>
  );
};

export default AdminDashboard;