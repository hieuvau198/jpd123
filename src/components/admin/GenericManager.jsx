import React, { useState, useEffect, useRef } from 'react';
import { Upload, Button, Table, message, Popconfirm, Tag as AntTag, Typography, Select, Modal, Alert, Flex } from 'antd';
// Added Download
import { UploadCloud, Trash2, RefreshCw, Filter, Eye, CheckCircle, Brain, Download } from 'lucide-react';
import tagsData from '../../data/system/tags.json';

// --- ADDED FOR CHEMISTRY RENDERING ---
import 'katex/dist/katex.min.css';
import { BlockMath, InlineMath } from 'react-katex';

const { Text, Title } = Typography;
const { Option } = Select;

const GenericManager = ({ type, icon, color, uploadText, uploadColor, fetchFn, fetchByTagFn, saveFn, deleteFn }) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const [selectedTag, setSelectedTag] = useState(fetchByTagFn ? 'none' : 'all');
  const processingFiles = useRef(0);

  const [previewVisible, setPreviewVisible] = useState(false);
  const [previewData, setPreviewData] = useState(null);

  useEffect(() => {
    loadData();
  }, [selectedTag]);

  const loadData = async () => {
    if (fetchByTagFn && selectedTag === 'none') {
      setData([]);
      return;
    }
    setLoading(true);
    let result = [];
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
        if (processingFiles.current === 0) loadData();
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

  // --- NEW DOWNLOAD FUNCTION ---
  const handleDownload = (record) => {
    const jsonString = JSON.stringify(record, null, 2);
    const blob = new Blob([jsonString], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement("a");
    link.href = url;
    link.download = `${record.id || 'source'}.json`;
    document.body.appendChild(link);
    link.click();
    
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Helper to safely mix regular text and KaTeX formulas
  const renderMixedText = (text) => {
    if (!text || typeof text !== 'string') return text;
    
    if (!text.includes('$')) return <span>{text}</span>;

    const parts = text.split(/\$(.*?)\$/g);
    return parts.map((part, index) => {
      if (index % 2 === 1) {
        return <InlineMath key={index} math={part} />;
      }
      return <span key={index}>{part}</span>;
    });
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
      width: 140, // Increased width for the extra button
      render: (_, record) => (
        <div style={{ display: 'flex', gap: 8 }}>
          {(type === 'quiz' || type === 'chemistry') && (
            <Button type="text" icon={<Eye size={16} />} onClick={() => handlePreview(record)} />
          )}
          {/* NEW DOWNLOAD BUTTON */}
          <Button type="text" icon={<Download size={16} />} onClick={() => handleDownload(record)} />
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
        {fetchByTagFn ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Filter size={16} color="#888" />
            <Select value={selectedTag} onChange={setSelectedTag} style={{ width: 200 }}>
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
        <Upload.Dragger accept=".json,.txt" multiple={true} showUploadList={false} beforeUpload={handleImport}>
          <p className="ant-upload-drag-icon"><UploadCloud size={32} color={uploadColor} /></p>
          <p className="ant-upload-text">{uploadText}</p>
          <p className="ant-upload-hint">Ignores if ID already exists.</p>
        </Upload.Dragger>
      </div>

      <Table rowSelection={{ selectedRowKeys, onChange: setSelectedRowKeys }} columns={columns} dataSource={data} rowKey="id" loading={loading} pagination={{ pageSize: 10 }} size="small" />

      <Modal
        title={`Preview: ${previewData?.title}`}
        open={previewVisible}
        onCancel={() => setPreviewVisible(false)}
        footer={null}
        width={800}
        styles={{ body: { maxHeight: '75vh', overflowY: 'auto', padding: '20px', background: '#fff' } }}
      >
        {previewData && (type === 'quiz' || type === 'chemistry') && (() => {
          const rawQuestions = Array.isArray(previewData) ? previewData.flatMap(d => d.questions) : (previewData.questions || []);
          if (!rawQuestions || rawQuestions.length === 0) return <p>No questions found in this source.</p>;

          return rawQuestions.map((q, index) => {
            const correctAnswer = q.correctAnswer || q.answer;
            return (
              <div key={index} style={{ marginBottom: 40, padding: '20px', border: '1px solid #f0f0f0', borderRadius: 8 }}>
                <Title level={4} style={{ marginTop: 0 }}>
                  {index + 1}. {type === 'chemistry' ? renderMixedText(q.text || q.question) : (q.text || q.question)}
                </Title>
                
                {type === 'chemistry' && q.formula && (
                  <div style={{ margin: '20px 0', padding: '15px', background: '#e6f7ff', borderLeft: '4px solid #1890ff', borderRadius: '4px', textAlign: 'center', fontSize: '1.2rem' }}>
                    <BlockMath math={q.formula} />
                  </div>
                )}

                <Flex vertical gap="middle" style={{ marginTop: 20 }}>
                  {q.options?.map((opt, idx) => {
                    const isCorrect = String(opt).trim() === String(correctAnswer).trim();
                    const customStyle = isCorrect ? { backgroundColor: 'black', color: 'white', borderColor: 'black' } : {};

                    return (
                      <Button key={idx} size="large" block style={{ height: 'auto', padding: '20px', textAlign: 'left', justifyContent: 'flex-start', fontSize: '1.1rem', ...customStyle }}>
                        <Flex justify="space-between" align="center" style={{ width: '100%' }}>
                           <span>{type === 'chemistry' ? renderMixedText(opt) : opt}</span>
                           {isCorrect && <CheckCircle size={20} />}
                        </Flex>
                      </Button>
                    );
                  })}
                </Flex>

                {q.explanation && (
                  <Alert
                    message={<span style={{ fontWeight: 'bold' }}>INSIGHT</span>}
                    description={type === 'chemistry' ? renderMixedText(q.explanation) : q.explanation}
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