import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, Button, Typography, Card, message, Popconfirm, Tag as AntTag, Input, Tabs, Table } from 'antd';
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
  const [selectedRowKeys, setSelectedRowKeys] = useState([]); // For bulk selection

  // --- DATA STATE ---
  const [loading, setLoading] = useState(false);
  const [flashcards, setFlashcards] = useState([]);
  const [quizzes, setQuizzes] = useState([]);
  const [repairs, setRepairs] = useState([]);
  
  const [dataLoaded, setDataLoaded] = useState({
    flashcard: false,
    quiz: false,
    repair: false
  });

  const processingFiles = useRef(0);

  // --- EFFECT: Fetch data when Tab Changes & Clear Selection ---
  useEffect(() => {
    if (isAuthenticated) {
      setSelectedRowKeys([]); // Clear selection when switching tabs
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

  // --- IMPORT ACTIONS ---
  const handleImport = (file, type) => {
    processingFiles.current += 1;
    setLoading(true);

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const json = JSON.parse(e.target.result);
        if (!json.id) throw new Error("Missing ID");
        
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
          loadDataForTab(type, true);
        }
      }
    };
    reader.readAsText(file);
    return false; 
  };

  // --- DELETE ACTIONS ---
  const handleDelete = async (id, type) => {
    try {
      setLoading(true);
      if (type === 'flashcard') await deleteFlashcardSet(id);
      else if (type === 'quiz') await deleteQuizSet(id);
      else if (type === 'repair') await deleteRepairSet(id);
      
      message.success("Item deleted");
      loadDataForTab(type, true); // Refresh
    } catch (err) {
      message.error("Failed to delete");
    } finally {
      setLoading(false);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedRowKeys.length === 0) return;

    setLoading(true);
    try {
      const deletePromises = selectedRowKeys.map(id => {
        if (activeTab === 'flashcard') return deleteFlashcardSet(id);
        if (activeTab === 'quiz') return deleteQuizSet(id);
        if (activeTab === 'repair') return deleteRepairSet(id);
        return Promise.resolve();
      });

      await Promise.all(deletePromises);
      message.success(`Deleted ${selectedRowKeys.length} items`);
      setSelectedRowKeys([]);
      loadDataForTab(activeTab, true);

    } catch (error) {
      console.error(error);
      message.error("Failed to delete some items");
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

  const renderTable = (data, type, icon, color) => {
    const columns = [
      {
        title: 'Title',
        dataIndex: 'title',
        key: 'title',
        render: (text, record) => (
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <span style={{ marginRight: 12 }}>{icon}</span>
            <div>
              <div style={{ fontWeight: 500 }}>{text}</div>
              <Text type="secondary" style={{fontSize:'0.8em'}}>{record.id}</Text>
            </div>
          </div>
        ),
      },
      {
        title: 'Info',
        key: 'info',
        render: (_, record) => (
          <>
            <AntTag color={color}>{record.subject || 'No Subject'}</AntTag>
            {record.tags && record.tags.map((tag, i) => (
              <AntTag key={i} style={{ marginTop: 4 }}>{tag}</AntTag>
            ))}
          </>
        ),
      },
      {
        title: 'Action',
        key: 'action',
        width: 80,
        render: (_, record) => (
          <Popconfirm title="Delete?" onConfirm={() => handleDelete(record.id, type)} okText="Yes" cancelText="No">
            <Button danger type="text" icon={<Trash2 size={16} />} />
          </Popconfirm>
        ),
      },
    ];

    const rowSelection = {
      selectedRowKeys,
      onChange: (keys) => setSelectedRowKeys(keys),
    };

    return (
      <Table 
        rowSelection={rowSelection}
        columns={columns} 
        dataSource={data} 
        rowKey="id"
        loading={loading && activeTab === type}
        pagination={{ pageSize: 10 }}
        size="small"
      />
    );
  };

  const renderTabContent = (data, type, icon, color, uploadText, uploadColor) => (
    <div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 10, marginBottom: 10 }}>
        {selectedRowKeys.length > 0 && (
          <Popconfirm title={`Delete ${selectedRowKeys.length} items?`} onConfirm={handleBulkDelete} okText="Yes" cancelText="No">
             <Button danger type="primary" icon={<Trash2 size={16}/>}>
               Delete Selected ({selectedRowKeys.length})
             </Button>
          </Popconfirm>
        )}
        <Button icon={<RefreshCw size={16}/>} onClick={() => loadDataForTab(type, true)} loading={loading}>
          Refresh
        </Button>
      </div>
      {renderUploadArea(type, uploadColor, uploadText)}
      {renderTable(data, type, icon, color)}
    </div>
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
      children: renderTabContent(
        flashcards, 
        'flashcard', 
        <FileJson color="#faad14" size={24} />, 
        'blue', 
        'Import Flashcards (JSON)', 
        '#1890ff'
      )
    },
    {
      key: 'quiz',
      label: 'Quizzes',
      children: renderTabContent(
        quizzes, 
        'quiz', 
        <FileQuestion color="#52c41a" size={24} />, 
        'green', 
        'Import Quizzes (JSON)', 
        '#52c41a'
      )
    },
    {
      key: 'repair',
      label: 'Repair (Sentence)',
      children: renderTabContent(
        repairs, 
        'repair', 
        <Wrench color="#722ed1" size={24} />, 
        'purple', 
        'Import Repair Sets (JSON)', 
        '#722ed1'
      )
    }
  ];

  return (
    <div style={{ maxWidth: 1000, margin: '40px auto', padding: 20 }}>
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