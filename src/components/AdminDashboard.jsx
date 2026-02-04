import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, Button, List, Typography, Card, message, Popconfirm, Tag as AntTag, Input, Tabs } from 'antd';
import { UploadCloud, Trash2, FileJson, RefreshCw, Home, FileQuestion, Lock, Wrench } from 'lucide-react';
import { getAllFlashcards, saveFlashcardSet, deleteFlashcardSet } from '../firebase/flashcardService';
import { getAllQuizzes, saveQuizSet, deleteQuizSet } from '../firebase/quizService';
import { getAllRepairs, saveRepairSet, deleteRepairSet } from '../firebase/repairService';

const { Title, Text } = Typography;

const AdminDashboard = () => {
  const navigate = useNavigate();
  
  // --- AUTH STATE ---
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passcode, setPasscode] = useState('');

  // --- UI STATE ---
  const [activeTab, setActiveTab] = useState('flashcard'); // Default tab

  // --- DATA STATE ---
  const [loading, setLoading] = useState(false);
  const [flashcards, setFlashcards] = useState([]);
  const [quizzes, setQuizzes] = useState([]);
  const [repairs, setRepairs] = useState([]);
  
  // To track if data has been loaded at least once to avoid re-fetching on every tab switch (optional)
  const [dataLoaded, setDataLoaded] = useState({
    flashcard: false,
    quiz: false,
    repair: false
  });

  const processingFiles = useRef(0);

  // --- EFFECT: Fetch data when Tab Changes ---
  useEffect(() => {
    if (isAuthenticated) {
      loadDataForTab(activeTab);
    }
  }, [isAuthenticated, activeTab]);

  const handleLogin = () => {
    if (passcode === '2000') {
      setIsAuthenticated(true);
      message.success("Access Granted");
    } else {
      message.error("Incorrect Passcode");
    }
  };

  const loadDataForTab = (tabKey, forceRefresh = false) => {
    // Only fetch if forced OR if we haven't loaded this tab's data yet
    if (forceRefresh || !dataLoaded[tabKey]) {
      if (tabKey === 'flashcard') fetchFlashcards();
      if (tabKey === 'quiz') fetchQuizzes();
      if (tabKey === 'repair') fetchRepairs();
    }
  };

  // --- FETCH FUNCTIONS ---
  const fetchFlashcards = async () => {
    setLoading(true);
    const data = await getAllFlashcards();
    setFlashcards(data);
    setDataLoaded(prev => ({ ...prev, flashcard: true }));
    setLoading(false);
  };

  const fetchQuizzes = async () => {
    setLoading(true);
    const data = await getAllQuizzes();
    setQuizzes(data);
    setDataLoaded(prev => ({ ...prev, quiz: true }));
    setLoading(false);
  };

  const fetchRepairs = async () => {
    setLoading(true);
    const data = await getAllRepairs();
    setRepairs(data);
    setDataLoaded(prev => ({ ...prev, repair: true }));
    setLoading(false);
  };

  // --- CRUD ACTIONS ---

  const handleImport = (file, type) => {
    processingFiles.current += 1;
    setLoading(true);

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const json = JSON.parse(e.target.result);
        
        if (!json.id || !json.questions) { // Note: 'questions' might not exist on all types, adjust validation as needed
          // Relaxed validation or specific validation per type could go here
           if (!json.id) throw new Error("Missing ID");
        } 
        
        let result;
        if (type === 'flashcard') result = await saveFlashcardSet(json);
        else if (type === 'quiz') result = await saveQuizSet(json);
        else if (type === 'repair') result = await saveRepairSet(json);

        if (result.success) {
          message.success(`Imported: ${json.title || file.name}`);
        } else {
          message.warning(`Skipped ${file.name}: ${result.message}`);
        }
        
      } catch (err) {
        message.error(`Error processing ${file.name}: ` + err.message);
      } finally {
        processingFiles.current -= 1;
        if (processingFiles.current === 0) {
          // Refresh only the current list
          if (type === 'flashcard') fetchFlashcards();
          else if (type === 'quiz') fetchQuizzes();
          else if (type === 'repair') fetchRepairs();
        }
      }
    };
    reader.readAsText(file);
    return false; // Prevent default upload behavior
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

  // --- RENDER HELPERS ---

  const renderUploadArea = (type, color, text) => (
    <div style={{ marginBottom: 20, padding: 20, border: '1px dashed #d9d9d9', borderRadius: 8, background: '#fafafa' }}>
      <Upload.Dragger 
        accept=".json" 
        multiple={true}
        showUploadList={false} 
        beforeUpload={(file) => handleImport(file, type)}
      >
        <p className="ant-upload-drag-icon"><UploadCloud size={32} color={color} /></p>
        <p className="ant-upload-text">{text}</p>
        <p className="ant-upload-hint">Ignores if ID already exists.</p>
      </Upload.Dragger>
    </div>
  );

  const renderList = (data, type, icon, color) => (
    <List
      loading={loading && activeTab === type}
      dataSource={data}
      pagination={{ pageSize: 5 }}
      renderItem={(item) => (
        <List.Item
          actions={[
            <Popconfirm title="Delete?" onConfirm={() => handleDelete(item.id, type)} okText="Yes" cancelText="No">
              <Button danger type="text" icon={<Trash2 size={16} />} />
            </Popconfirm>
          ]}
        >
          <List.Item.Meta
            avatar={icon}
            title={<span>{item.title} <Text type="secondary" style={{fontSize:'0.8em'}}>({item.id})</Text></span>}
            description={
              <>
                <AntTag color={color}>{item.subject || 'No Subject'}</AntTag>
                {item.tags && item.tags.map((tag, i) => (
                  <AntTag key={i} style={{ marginTop: 4 }}>{tag}</AntTag>
                ))}
              </>
            }
          />
        </List.Item>
      )}
    />
  );

  // --- LOGIN VIEW ---
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

  // --- MAIN VIEW ---
  const tabItems = [
    {
      key: 'flashcard',
      label: 'Flashcards',
      children: (
        <div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 10 }}>
            <Button icon={<RefreshCw size={16}/>} onClick={() => loadDataForTab('flashcard', true)} loading={loading}>Refresh</Button>
          </div>
          {renderUploadArea('flashcard', '#1890ff', 'Import Flashcards (JSON)')}
          {renderList(flashcards, 'flashcard', <FileJson color="#faad14" size={24} />, 'blue')}
        </div>
      )
    },
    {
      key: 'quiz',
      label: 'Quizzes',
      children: (
        <div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 10 }}>
            <Button icon={<RefreshCw size={16}/>} onClick={() => loadDataForTab('quiz', true)} loading={loading}>Refresh</Button>
          </div>
          {renderUploadArea('quiz', '#52c41a', 'Import Quizzes (JSON)')}
          {renderList(quizzes, 'quiz', <FileQuestion color="#52c41a" size={24} />, 'green')}
        </div>
      )
    },
    {
      key: 'repair',
      label: 'Repair (Sentence)',
      children: (
        <div>
           <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 10 }}>
            <Button icon={<RefreshCw size={16}/>} onClick={() => loadDataForTab('repair', true)} loading={loading}>Refresh</Button>
          </div>
          {renderUploadArea('repair', '#722ed1', 'Import Repair Sets (JSON)')}
          {renderList(repairs, 'repair', <Wrench color="#722ed1" size={24} />, 'purple')}
        </div>
      )
    }
  ];

  return (
    <div style={{ maxWidth: 900, margin: '40px auto', padding: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 30 }}>
        <Title level={2} style={{ margin: 0 }}>Content Management</Title>
        <Button icon={<Home size={16} />} onClick={() => navigate('/')}>Back to Home</Button>
      </div>

      <Card>
        <Tabs 
          activeKey={activeTab} 
          onChange={setActiveTab} 
          items={tabItems}
          type="card"
        />
      </Card>
    </div>
  );
};

export default AdminDashboard;