import React, { useState, useEffect, useRef } from 'react';
import { Upload, Button, Table, message, Popconfirm, Tag as AntTag, Typography } from 'antd';
import { UploadCloud, Trash2, RefreshCw } from 'lucide-react';

const { Text } = Typography;

const GenericManager = ({ type, icon, color, uploadText, uploadColor, fetchFn, saveFn, deleteFn }) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const processingFiles = useRef(0);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const result = await fetchFn();
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
      <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', marginBottom: 15 }}>
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
    </div>
  );
};

export default GenericManager;