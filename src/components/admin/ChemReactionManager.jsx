// src/components/admin/ChemReactionManager.jsx
import React, { useState, useEffect, useRef } from 'react';
import { Upload, Button, Table, message, Popconfirm, Tag as AntTag, Typography, Select, Modal, Alert, Flex } from 'antd';
// Add Download to imports
import { UploadCloud, Trash2, RefreshCw, Filter, Eye, Download } from 'lucide-react';
import tagsData from '../../data/system/chem_tags.json';

import 'katex/dist/katex.min.css';
import { BlockMath, InlineMath } from 'react-katex';

const { Text, Title } = Typography;
const { Option } = Select;

const ChemReactionManager = ({ icon, color, uploadText, uploadColor, fetchFn, fetchByTagFn, saveFn, deleteFn }) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedTag, setSelectedTag] = useState('none');
  const processingFiles = useRef(0);

  const [previewVisible, setPreviewVisible] = useState(false);
  const [previewData, setPreviewData] = useState(null);

  useEffect(() => { loadData(); }, [selectedTag]);

  const loadData = async () => {
    if (selectedTag === 'none') { setData([]); return; }
    setLoading(true);
    const result = selectedTag !== 'all' ? await fetchByTagFn(selectedTag) : await fetchFn();
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
        if (!json.reactions) throw new Error("Missing 'reactions' array in JSON");
        
        const result = await saveFn(json);
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
    try {
      setLoading(true);
      await deleteFn(id);
      message.success("Item deleted");
      loadData();
    } catch (err) { message.error("Failed to delete"); }
    finally { setLoading(false); }
  };

  // --- NEW DOWNLOAD FUNCTION ---
  const handleDownload = (record) => {
    const jsonString = JSON.stringify(record, null, 2);
    const blob = new Blob([jsonString], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement("a");
    link.href = url;
    link.download = `${record.id || 'reaction_source'}.json`;
    document.body.appendChild(link);
    link.click();
    
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const renderMixedText = (text) => {
    if (!text || typeof text !== 'string') return text;
    if (!text.includes('$')) return <span>{text}</span>;
    const parts = text.split(/\$(.*?)\$/g);
    return parts.map((part, index) => (
      index % 2 === 1 ? <InlineMath key={index} math={part} /> : <span key={index}>{part}</span>
    ));
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
              {record.id}
            </Text>
          </div>
        </div>
      ),
    },
    {
      title: 'Action',
      key: 'action',
      width: 140, // Expanded slightly for 3 buttons
      render: (_, record) => (
        <div style={{ display: 'flex', gap: 8 }}>
          <Button type="text" icon={<Eye size={16} />} onClick={() => { setPreviewData(record); setPreviewVisible(true); }} />
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
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Filter size={16} color="#888" />
          <Select value={selectedTag} onChange={setSelectedTag} style={{ width: 200 }}>
            <Option value="none">None (Select to view)</Option>
            <Option value="all">All Items</Option>
            {tagsData.map(tag => <Option key={tag.id} value={tag.id}>{tag.name}</Option>)}
          </Select>
        </div>
        <Button icon={<RefreshCw size={16}/>} onClick={loadData} loading={loading} disabled={selectedTag === 'none'}>
          Refresh
        </Button>
      </div>
      
      <div style={{ marginBottom: 20, padding: 20, border: '1px dashed #d9d9d9', borderRadius: 8, background: '#fafafa' }}>
        <Upload.Dragger accept=".json,.txt" multiple={true} showUploadList={false} beforeUpload={handleImport}>
          <p className="ant-upload-drag-icon"><UploadCloud size={32} color={uploadColor} /></p>
          <p className="ant-upload-text">{uploadText}</p>
          <p className="ant-upload-hint">Ignores if ID already exists. Requires 'reactions' array.</p>
        </Upload.Dragger>
      </div>

      <Table columns={columns} dataSource={data} rowKey="id" loading={loading} pagination={{ pageSize: 10 }} size="small" />

      <Modal
        title={`Preview: ${previewData?.title}`} open={previewVisible} onCancel={() => setPreviewVisible(false)}
        footer={null} width={800} styles={{ body: { maxHeight: '75vh', overflowY: 'auto', padding: '20px' } }}
      >
        {previewData && (() => {
          const rawReactions = Array.isArray(previewData) ? previewData.flatMap(d => d.reactions) : (previewData.reactions || []);
          return rawReactions.map((reaction, index) => (
            <div key={index} style={{ marginBottom: 40, padding: '20px', border: '1px solid #f0f0f0', borderRadius: 8 }}>
              <Title level={4} style={{ marginTop: 0 }}>{index + 1}. {renderMixedText(reaction.name)}</Title>
              
              {reaction.formula && (
                <div style={{ margin: '20px 0', padding: '15px', background: '#e6f7ff', borderLeft: '4px solid #1890ff', borderRadius: '4px', textAlign: 'center', fontSize: '1.2rem', overflowX: 'auto' }}>
                  <BlockMath math={reaction.formula} />
                </div>
              )}
              
              <div style={{ marginTop: 20, display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {reaction.valency && Object.keys(reaction.valency).length > 0 && (
                  <div>
                    <Text strong>Valency:</Text>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '6px' }}>
                      {Object.entries(reaction.valency).map(([element, val]) => (
                         <AntTag color="geekblue" key={element} style={{ fontSize: '14px', padding: '2px 8px' }}>
                           {element}: <b>{val}</b>
                         </AntTag>
                      ))}
                    </div>
                  </div>
                )}
                
                {reaction.condition && (
                  <div>
                    <Text strong>Condition: </Text> <Text>{renderMixedText(reaction.condition)}</Text>
                  </div>
                )}
                
                {reaction.description && (
                  <div>
                    <Text strong>Description: </Text> <Text>{renderMixedText(reaction.description)}</Text>
                  </div>
                )}
              </div>
            </div>
          ));
        })()}
      </Modal>
    </div>
  );
};

export default ChemReactionManager;