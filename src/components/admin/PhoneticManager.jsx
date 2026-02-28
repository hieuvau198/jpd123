// src/components/admin/PhoneticManager.jsx
import React, { useState, useEffect, useRef } from 'react';
import { Upload, Button, Table, message, Popconfirm, Tag as AntTag, Typography, Select, Modal, Input } from 'antd';
import { UploadCloud, Trash2, RefreshCw, Filter, Edit } from 'lucide-react';
import { getAllPhonetics, getPhoneticsByTag, savePhoneticSet, deletePhoneticSet, updatePhoneticSet } from '../../firebase/phoneticService';
import tagsData from '../../data/system/tags.json';

const { Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;

const PhoneticManager = ({ icon, color, uploadText, uploadColor }) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const [selectedTag, setSelectedTag] = useState('none');
  const processingFiles = useRef(0);

  // Edit Modal State
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [editingData, setEditingData] = useState('');
  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    loadData();
  }, [selectedTag]);

  const loadData = async () => {
    if (selectedTag === 'none') {
      setData([]);
      return;
    }

    setLoading(true);
    let result = [];
    if (selectedTag === 'all') {
      result = await getAllPhonetics();
    } else {
      result = await getPhoneticsByTag(selectedTag);
    }
    setData(result);
    setLoading(false);
  };

  const handleImport = (file) => {
    processingFiles.current += 1;
    setLoading(true);

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const json = JSON.parse(e.target.result);
        if (!json.id) throw new Error("Missing ID");
        
        const result = await savePhoneticSet(json);
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
          loadData();
        }
      }
    };
    reader.readAsText(file);
    return false; 
  };

  const handleDelete = async (id) => {
    try {
      setLoading(true);
      await deletePhoneticSet(id);
      message.success("Item deleted");
      loadData();
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
      await Promise.all(selectedRowKeys.map(id => deletePhoneticSet(id)));
      message.success(`Deleted ${selectedRowKeys.length} items`);
      setSelectedRowKeys([]);
      loadData();
    } catch (error) {
      message.error("Failed to delete some items");
    } finally {
      setLoading(false);
    }
  };

  // Edit Functions
  const openEditModal = (record) => {
    setEditingId(record.id);
    // Remove metadata like 'type' if you don't want them in the raw JSON editor
    const recordToEdit = { ...record };
    setEditingData(JSON.stringify(recordToEdit, null, 2));
    setIsEditModalVisible(true);
  };

  const handleSaveEdit = async () => {
    try {
      setLoading(true);
      const updatedJson = JSON.parse(editingData);
      
      // Ensure ID isn't changed and breaks the doc mapping
      if (updatedJson.id !== editingId) {
         message.error("You cannot change the ID of an existing item. Please create a new one instead.");
         setLoading(false);
         return;
      }

      await updatePhoneticSet(editingId, updatedJson);
      message.success("Item updated successfully");
      setIsEditModalVisible(false);
      loadData();
    } catch (error) {
      message.error("Invalid JSON format or failed to update. Please check your syntax.");
    } finally {
      setLoading(false);
    }
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
              {record.id} {record.type && `(Type: ${record.type.toUpperCase()})`}
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
      width: 120,
      render: (_, record) => (
        <div style={{ display: 'flex', gap: '8px' }}>
          <Button type="text" icon={<Edit size={16} color="#1890ff" />} onClick={() => openEditModal(record)} />
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
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Filter size={16} color="#888" />
          <Select 
            value={selectedTag} 
            onChange={setSelectedTag} 
            style={{ width: 200 }}
          >
            <Option value="none">None (Select to view)</Option>
            <Option value="all">All Phonetics</Option>
            {tagsData.map(tag => (
              <Option key={tag.id} value={tag.id}>{tag.name}</Option>
            ))}
          </Select>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          {selectedRowKeys.length > 0 && (
            <Popconfirm title={`Delete ${selectedRowKeys.length} items?`} onConfirm={handleBulkDelete} okText="Yes" cancelText="No">
               <Button danger type="primary" icon={<Trash2 size={16}/>}>
                 Delete Selected ({selectedRowKeys.length})
               </Button>
            </Popconfirm>
          )}
          <Button icon={<RefreshCw size={16}/>} onClick={loadData} loading={loading} disabled={selectedTag === 'none'}>
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

      {/* EDIT MODAL */}
      <Modal
        title={`Edit Phonetic Set: ${editingId}`}
        open={isEditModalVisible}
        onOk={handleSaveEdit}
        onCancel={() => setIsEditModalVisible(false)}
        width={800}
        confirmLoading={loading}
        okText="Save Changes"
      >
        <Typography.Text type="secondary" style={{ display: 'block', marginBottom: '10px' }}>
          Edit the JSON structure below. Ensure valid JSON syntax before saving.
        </Typography.Text>
        <TextArea 
          rows={20} 
          value={editingData} 
          onChange={(e) => setEditingData(e.target.value)} 
          style={{ fontFamily: 'monospace' }}
        />
      </Modal>
    </div>
  );
};

export default PhoneticManager;