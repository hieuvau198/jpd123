import React, { useState, useEffect, useRef } from 'react';
// Added Modal, Alert, Flex, Title for the preview modal
import { Upload, Button, Table, message, Popconfirm, Tag as AntTag, Typography, Select, Modal, Alert, Flex } from 'antd';
// Added Eye, CheckCircle, Brain icons for the preview styling
import { UploadCloud, Trash2, RefreshCw, Filter, Eye, CheckCircle, Brain } from 'lucide-react';
// IMPORT tags
import tagsData from '../../data/system/tags.json';

const { Text, Title } = Typography;
const { Option } = Select;

// ADD fetchByTagFn to props
const GenericManager = ({ type, icon, color, uploadText, uploadColor, fetchFn, fetchByTagFn, saveFn, deleteFn }) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  
  // State for tags: Default to 'none' if filter is enabled, else 'all'
  const [selectedTag, setSelectedTag] = useState(fetchByTagFn ? 'none' : 'all');
  const processingFiles = useRef(0);

  // States for Preview Modal
  const [previewVisible, setPreviewVisible] = useState(false);
  const [previewData, setPreviewData] = useState(null);

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

  const handlePreview = (record) => {
    setPreviewData(record);
    setPreviewVisible(true);
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
      render: (_, record) => (
        <div style={{ display: 'flex', gap: 8 }}>
          {/* Show Preview button only for quiz types to match your request */}
          {type === 'quiz' && (
            <Button type="text" icon={<Eye size={16} />} onClick={() => handlePreview(record)} />
          )}
          <Popconfirm title="Delete?" onConfirm={() => handleDelete(record.id)} okText="Yes" cancelText="No">
            <Button danger type="text" icon={<Trash2 size={16} />} />
          </Popconfirm>
        </div>
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

      {/* Preview Modal for Quizzes styled like QuizSession */}
      <Modal
        title={`Preview: ${previewData?.title}`}
        open={previewVisible}
        onCancel={() => setPreviewVisible(false)}
        footer={null}
        width={800}
        styles={{ body: { maxHeight: '75vh', overflowY: 'auto', padding: '20px', background: '#fff' } }}
      >
        {previewData && type === 'quiz' && (() => {
          const rawQuestions = Array.isArray(previewData) 
            ? previewData.flatMap(d => d.questions) 
            : (previewData.questions || []);

          if (!rawQuestions || rawQuestions.length === 0) {
            return <p>No questions found in this quiz source.</p>;
          }

          return rawQuestions.map((q, index) => {
            const correctAnswer = q.correctAnswer || q.answer;
            return (
              <div key={index} style={{ marginBottom: 40, padding: '20px', border: '1px solid #f0f0f0', borderRadius: 8 }}>
                <Title level={4} style={{ marginTop: 0 }}>
                  {index + 1}. {q.text || q.question}
                </Title>
                <Flex vertical gap="middle" style={{ marginTop: 20 }}>
                  {q.options?.map((opt, idx) => {
                    const isCorrect = String(opt).trim() === String(correctAnswer).trim();
                    const customStyle = isCorrect 
                      ? { backgroundColor: 'black', color: 'white', borderColor: 'black' } 
                      : {};

                    return (
                      <Button
                        key={idx}
                        size="large"
                        block
                        style={{ height: 'auto', padding: '20px', textAlign: 'left', justifyContent: 'flex-start', fontSize: '1.1rem', ...customStyle }}
                      >
                        <Flex justify="space-between" align="center" style={{ width: '100%' }}>
                           <span>{opt}</span>
                           {isCorrect && <CheckCircle size={20} />}
                        </Flex>
                      </Button>
                    );
                  })}
                </Flex>

                {q.explanation && (
                  <Alert
                    message={<span style={{ fontWeight: 'bold' }}>INSIGHT</span>}
                    description={q.explanation}
                    type="info"
                    showIcon
                    icon={<Brain size={24} />}
                    style={{ marginTop: 20, borderColor: 'black', background: '#f8f9fa' }}
                  />
                )}
              </div>
            );
          });
        })()}
      </Modal>
    </div>
  );
};

export default GenericManager;