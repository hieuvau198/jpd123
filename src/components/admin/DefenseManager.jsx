import React, { useState, useEffect, useRef } from 'react';
import { Upload, Button, Table, message, Popconfirm, Tag as AntTag, Typography, Modal, Form, Select, Input, InputNumber } from 'antd';
// 1. ADD 'Edit' ICON HERE
import { UploadCloud, Trash2, RefreshCw, Plus, Shield, Edit } from 'lucide-react';
// 2. IMPORT 'updateDefenseSet' HERE
import { getAllDefenses, saveDefenseSet, deleteDefenseSet, updateDefenseSet } from '../../firebase/defenseService';
import { getAllFlashcards } from '../../firebase/flashcardService';
import { getAllQuizzes } from '../../firebase/quizService';
import { getAllRepairs } from '../../firebase/repairService';
import { getAllSpeaks } from '../../firebase/speakService';

const { Text } = Typography;
const { Option } = Select;

const DefenseManager = ({ icon, color, uploadText, uploadColor }) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  
  const [isModalVisible, setIsModalVisible] = useState(false);
  // 3. ADD editingId STATE
  const [editingId, setEditingId] = useState(null); 
  const [defenseForm] = Form.useForm();
  const selectedDefenseType = Form.useWatch('type', defenseForm);
  
  const [sources, setSources] = useState({ flashcard: [], quiz: [], repair: [], speak: [] });
  const processingFiles = useRef(0);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const result = await getAllDefenses();
    setData(result);
    setLoading(false);
  };

  // Extract source fetching into a reusable function
  const fetchSources = async () => {
    setLoading(true);
    try {
      const [f, q, r, s] = await Promise.all([
        getAllFlashcards(), getAllQuizzes(), getAllRepairs(), getAllSpeaks()
      ]);
      setSources({ flashcard: f, quiz: q, repair: r, speak: s });
    } catch (err) {
      message.error("Failed to load source files for options");
    }
    setLoading(false);
  };

  const openDefenseModal = async () => {
    setEditingId(null); // Ensure we are not in edit mode
    defenseForm.resetFields();
    defenseForm.setFieldsValue({ enemyCount: 20, spawnRate: 2000 });
    setIsModalVisible(true);
    await fetchSources();
  };

  // 4. ADD FUNCTION TO OPEN MODAL FOR EDITING
  const openEditModal = async (record) => {
    setEditingId(record.id);
    defenseForm.setFieldsValue({
      title: record.title,
      type: record.type,
      sourceId: record.sourceId,
      enemyCount: record.enemyCount,
      spawnRate: record.spawnRate,
      tags: record.tags || [],
    });
    setIsModalVisible(true);
    await fetchSources();
  };

  // 5. UPDATE SUBMIT HANDLER TO HANDLE BOTH CREATE AND UPDATE
  const handleSaveDefense = async (values) => {
    setLoading(true);
    try {
      if (editingId) {
        // Update existing
        const updatedDefense = {
          id: editingId,
          title: values.title,
          type: values.type,
          sourceId: values.sourceId,
          enemyCount: values.enemyCount,
          spawnRate: values.spawnRate,
          tags: values.tags || [],
        };
        const result = await updateDefenseSet(editingId, updatedDefense);
        if (result.success) {
          message.success('Defense Level Updated Successfully!');
          setIsModalVisible(false);
          loadData();
        } else {
          message.error(result.message);
        }
      } else {
        // Create new
        const newDefense = {
          id: `def-${Date.now()}`,
          title: values.title,
          type: values.type,
          sourceId: values.sourceId,
          enemyCount: values.enemyCount,
          spawnRate: values.spawnRate,
          tags: values.tags || [],
        };
        const result = await saveDefenseSet(newDefense);
        if (result.success) {
          message.success('Defense Level Created Successfully!');
          setIsModalVisible(false);
          loadData();
        } else {
          message.error(result.message);
        }
      }
    } catch (error) {
      message.error(`Failed to ${editingId ? 'update' : 'create'} defense config`);
    } finally {
      setLoading(false);
    }
  };

  const getSourceOptions = () => {
    if (!selectedDefenseType) return [];
    return sources[selectedDefenseType].map(s => ({ label: s.title, value: s.id }));
  };

  const handleImport = (file) => {
    processingFiles.current += 1;
    setLoading(true);
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const json = JSON.parse(e.target.result);
        if (!json.id) throw new Error("Missing ID");
        const result = await saveDefenseSet(json);
        if (result.success) message.success(`Imported: ${json.title || file.name}`);
        else message.warning(`Skipped ${file.name}: ${result.message}`);
      } catch (err) {
        message.error(`Error processing ${file.name}: ` + err.message);
      } finally {
        processingFiles.current -= 1;
        if (processingFiles.current === 0) loadData();
      }
    };
    reader.readAsText(file);
    return false; 
  };

  const handleDelete = async (id) => {
    setLoading(true);
    try {
      await deleteDefenseSet(id);
      message.success("Item deleted");
      loadData();
    } catch (err) {
      message.error("Failed to delete");
    }
    setLoading(false);
  };

  const handleBulkDelete = async () => {
    if (selectedRowKeys.length === 0) return;
    setLoading(true);
    try {
      await Promise.all(selectedRowKeys.map(id => deleteDefenseSet(id)));
      message.success(`Deleted ${selectedRowKeys.length} items`);
      setSelectedRowKeys([]);
      loadData();
    } catch (error) {
      message.error("Failed to delete items");
    }
    setLoading(false);
  };

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
            <Text type="secondary" style={{fontSize:'0.8em'}}>
              {record.id} {record.type && `(Source: ${record.type.toUpperCase()})`}
            </Text>
          </div>
        </div>
      ),
    },
    {
      title: 'Info',
      key: 'info',
      render: (_, record) => (
        <>
          {record.subject && <AntTag color={color}>{record.subject}</AntTag>}
          {record.tags && record.tags.map((tag, i) => (
            <AntTag key={i} style={{ marginTop: 4 }}>{tag}</AntTag>
          ))}
        </>
      ),
    },
    {
      title: 'Action',
      key: 'action',
      width: 100,
      // 6. ADD EDIT BUTTON TO THE ACTIONS COLUMN
      render: (_, record) => (
        <div style={{ display: 'flex', gap: '8px' }}>
          <Button type="text" icon={<Edit size={16} />} onClick={() => openEditModal(record)} />
          <Popconfirm title="Delete?" onConfirm={() => handleDelete(record.id)} okText="Yes" cancelText="No">
            <Button danger type="text" icon={<Trash2 size={16} />} />
          </Popconfirm>
        </div>
      ),
    },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 }}>
        <Button type="primary" icon={<Plus size={16} />} onClick={openDefenseModal}>
          Create Defense Level
        </Button>
        <div style={{ display: 'flex', gap: 10 }}>
          {selectedRowKeys.length > 0 && (
            <Popconfirm title={`Delete ${selectedRowKeys.length} items?`} onConfirm={handleBulkDelete} okText="Yes" cancelText="No">
               <Button danger type="primary" icon={<Trash2 size={16}/>}>
                 Delete Selected ({selectedRowKeys.length})
               </Button>
            </Popconfirm>
          )}
          <Button icon={<RefreshCw size={16}/>} onClick={loadData} loading={loading}>
            Refresh
          </Button>
        </div>
      </div>
      
      <div style={{ marginBottom: 20, padding: 20, border: '1px dashed #d9d9d9', borderRadius: 8, background: '#fafafa' }}>
        <Upload.Dragger accept=".json" multiple={true} showUploadList={false} beforeUpload={handleImport}>
          <p className="ant-upload-drag-icon"><UploadCloud size={32} color={uploadColor} /></p>
          <p className="ant-upload-text">{uploadText}</p>
          <p className="ant-upload-hint">Ignores if ID already exists.</p>
        </Upload.Dragger>
      </div>

      <Table 
        rowSelection={{ selectedRowKeys, onChange: setSelectedRowKeys }}
        columns={columns} 
        dataSource={data} 
        rowKey="id"
        loading={loading}
        pagination={{ pageSize: 10 }}
        size="small"
      />

      <Modal
        // 7. DYNAMIC MODAL TITLE AND BUTTON TEXT
        title={<div><Shield className="inline mr-2 text-red-500" size={20} /> {editingId ? 'Edit Defense Level' : 'Create New Defense Level'}</div>}
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        footer={null}
        destroyOnClose
      >
        <Form form={defenseForm} layout="vertical" onFinish={handleSaveDefense} style={{ marginTop: 20 }}>
          <Form.Item name="title" label="Defense Level Title" rules={[{ required: true, message: 'Required' }]}>
            <Input placeholder="e.g. Unit 1 Base Defense" />
          </Form.Item>

          <Form.Item name="type" label="Source Data Type" rules={[{ required: true, message: 'Required' }]}>
            <Select placeholder="Select the type of questions" onChange={() => defenseForm.setFieldsValue({ sourceId: undefined })}>
              <Option value="flashcard">Flashcards</Option>
              <Option value="quiz">Quizzes</Option>
              <Option value="repair">Repair Sentences</Option>
              <Option value="speak">Speak Datasets</Option>
            </Select>
          </Form.Item>

          <Form.Item name="sourceId" label="Select Existing Source" rules={[{ required: true, message: 'Required' }]}>
            <Select 
              placeholder="Choose from existing data..." 
              options={getSourceOptions()} 
              disabled={!selectedDefenseType}
              showSearch
              filterOption={(input, option) => (option?.label ?? '').toLowerCase().includes(input.toLowerCase())}
            />
          </Form.Item>

          <div style={{ display: 'flex', gap: 16 }}>
            <Form.Item name="enemyCount" label="Total Enemies" style={{ flex: 1 }} rules={[{ required: true }]}>
              <InputNumber min={5} max={100} style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item name="spawnRate" label="Spawn Rate (ms)" style={{ flex: 1 }} rules={[{ required: true }]}>
              <InputNumber min={500} max={10000} step={500} style={{ width: '100%' }} />
            </Form.Item>
          </div>

          <Form.Item name="tags" label="Tags">
            <Select mode="tags" placeholder="Add tags..." />
          </Form.Item>

          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Button onClick={() => setIsModalVisible(false)} style={{ marginRight: 10 }}>Cancel</Button>
            <Button type="primary" htmlType="submit" loading={loading}>{editingId ? 'Update Config' : 'Save Defense Config'}</Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default DefenseManager;