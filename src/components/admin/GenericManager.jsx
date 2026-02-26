import React, { useState, useEffect, useRef } from 'react';
// IMPORT Select
import { Upload, Button, Table, message, Popconfirm, Tag as AntTag, Typography, Select } from 'antd';
// IMPORT Filter
import { UploadCloud, Trash2, RefreshCw, Filter } from 'lucide-react';
// IMPORT tags
import tagsData from '../../data/system/tags.json';

const { Text } = Typography;
const { Option } = Select;

// ADD fetchByTagFn to props
const GenericManager = ({ type, icon, color, uploadText, uploadColor, fetchFn, fetchByTagFn, saveFn, deleteFn }) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  
  // State for tags: Default to 'none' if filter is enabled, else 'all'
  const [selectedTag, setSelectedTag] = useState(fetchByTagFn ? 'none' : 'all');
  const processingFiles = useRef(0);

  // Trigger loadData when selectedTag changes
  useEffect(() => {
    loadData();
  }, [selectedTag]);

  const loadData = async () => {
    // If tag filtering is enabled and 'none' is selected, don't fetch
    if (fetchByTagFn && selectedTag === 'none') {
      setData([]);
      return;
    }

    setLoading(true);
    let result = [];
    
    // Choose the right fetch function
    if (fetchByTagFn && selectedTag !== 'all') {
      result = await fetchByTagFn(selectedTag);
    } else {
      result = await fetchFn();
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
        
        const result = await saveFn(json);
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
      await deleteFn(id);
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
      await Promise.all(selectedRowKeys.map(id => deleteFn(id)));
      message.success(`Deleted ${selectedRowKeys.length} items`);
      setSelectedRowKeys([]);
      loadData();
    } catch (error) {
      message.error("Failed to delete some items");
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
      width: 80,
      render: (_, record) => (
        <Popconfirm title="Delete?" onConfirm={() => handleDelete(record.id)} okText="Yes" cancelText="No">
          <Button danger type="text" icon={<Trash2 size={16} />} />
        </Popconfirm>
      ),
    },
  ];

  return (
    <div>
      {/* Change justifyContent to space-between to fit the filter on the left */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 }}>
        
        {/* Render TAG FILTER only if fetchByTagFn is passed */}
        {fetchByTagFn ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Filter size={16} color="#888" />
            <Select 
              value={selectedTag} 
              onChange={setSelectedTag} 
              style={{ width: 200 }}
            >
              <Option value="none">None (Select to view)</Option>
              <Option value="all">All Items</Option>
              {tagsData.map(tag => (
                <Option key={tag.id} value={tag.id}>{tag.name}</Option>
              ))}
            </Select>
          </div>
        ) : <div />}

        <div style={{ display: 'flex', gap: 10 }}>
          {selectedRowKeys.length > 0 && (
            <Popconfirm title={`Delete ${selectedRowKeys.length} items?`} onConfirm={handleBulkDelete} okText="Yes" cancelText="No">
               <Button danger type="primary" icon={<Trash2 size={16}/>}>
                 Delete Selected ({selectedRowKeys.length})
               </Button>
            </Popconfirm>
          )}
          <Button icon={<RefreshCw size={16}/>} onClick={loadData} loading={loading} disabled={fetchByTagFn && selectedTag === 'none'}>
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
    </div>
  );
};

export default GenericManager;