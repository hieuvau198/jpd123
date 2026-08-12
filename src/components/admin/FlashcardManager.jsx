import React, { useState, useEffect, useRef } from 'react';
import { Upload, Button, Table, message, Popconfirm, Tag as AntTag, Typography, Select, Modal, Input, Space } from 'antd';
import { UploadCloud, Trash2, RefreshCw, Filter, Download, Eye } from 'lucide-react';
import { getAllFlashcards, getFlashcardsByTag, saveFlashcardSet, deleteFlashcardSet } from '../../firebase/flashcardService';
import tagsData from '../../data/system/tags.json';

const { Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;

const FlashcardManager = ({ icon, color, uploadText, uploadColor }) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const [selectedTag, setSelectedTag] = useState('none');
  const processingFiles = useRef(0);

  // View / Edit Modal State
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [jsonContent, setJsonContent] = useState('');
  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    loadData();
  }, [selectedTag]);

  const loadData = async () => {
    if (selectedTag === 'none') {
      setData([]); // Do not fetch to save quota
      return;
    }

    setLoading(true);
    let result = [];
    if (selectedTag === 'all') {
      result = await getAllFlashcards();
    } else {
      result = await getFlashcardsByTag(selectedTag);
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
        
        const result = await saveFlashcardSet(json);
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
      await deleteFlashcardSet(id);
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
      await Promise.all(selectedRowKeys.map(id => deleteFlashcardSet(id)));
      message.success(`Deleted ${selectedRowKeys.length} items`);
      setSelectedRowKeys([]);
      loadData();
    } catch (error) {
      message.error("Failed to delete some items");
    } finally {
      setLoading(false);
    }
  };

  // --- New Handlers for View/Edit & Download ---

  const handleDownload = (record) => {
    const dataStr = JSON.stringify(record, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement("a");
    link.href = url;
    link.download = `flashcard_${record.id}.json`;
    document.body.appendChild(link);
    link.click();
    
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleView = (record) => {
    setEditingId(record.id);
    setJsonContent(JSON.stringify(record, null, 2));
    setIsModalVisible(true);
  };

  const handleSaveEdit = async () => {
    try {
      const parsedJson = JSON.parse(jsonContent);
      if (!parsedJson.id) throw new Error("JSON must contain an 'id' field.");
      
      setLoading(true);
      const result = await saveFlashcardSet(parsedJson);
      if (result.success) {
        message.success("Flashcard updated successfully!");
        setIsModalVisible(false);
        loadData();
      } else {
        message.error(`Failed to update: ${result.message}`);
      }
    } catch (err) {
      message.error(`Invalid JSON format: ${err.message}`);
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
      width: 140,
      render: (_, record) => (
        <Space size="small">
          <Button type="text" title="View/Edit JSON" icon={<Eye size={16} />} onClick={() => handleView(record)} />
          <Button type="text" title="Download JSON" icon={<Download size={16} />} onClick={() => handleDownload(record)} />
          <Popconfirm title="Delete?" onConfirm={() => handleDelete(record.id)} okText="Yes" cancelText="No">
            <Button danger type="text" title="Delete" icon={<Trash2 size={16} />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 }}>
        
        {/* TAG FILTER */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Filter size={16} color="#888" />
          <Select 
            value={selectedTag} 
            onChange={setSelectedTag} 
            style={{ width: 200 }}
          >
            <Option value="none">None</Option>
            <Option value="all">All</Option>
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

      {/* JSON View/Edit Modal */}
      <Modal
        title={`View & Edit JSON - ${editingId}`}
        open={isModalVisible}
        onOk={handleSaveEdit}
        onCancel={() => setIsModalVisible(false)}
        okText="Save Changes"
        cancelText="Cancel"
        width={800}
        confirmLoading={loading}
      >
        <TextArea
          rows={20}
          value={jsonContent}
          onChange={(e) => setJsonContent(e.target.value)}
          spellCheck={false}
          style={{ fontFamily: 'monospace', fontSize: '14px' }}
        />
      </Modal>
    </div>
  );
};

export default FlashcardManager;