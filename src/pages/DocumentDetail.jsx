// src/pages/DocumentDetail.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Spin, Button } from 'antd';
import { ArrowLeft } from 'lucide-react';
import { getDocumentById } from '../firebase/documentService';
import DocumentHeader from '../components/document/DocumentHeader';
import DocumentTOC from '../components/document/DocumentTOC';
import DocumentBody from '../components/document/DocumentBody';

const DocumentDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [document, setDocument] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDoc = async () => {
      setLoading(true);
      const data = await getDocumentById(id);
      setDocument(data);
      setLoading(false);
    };
    if (id) fetchDoc();
  }, [id]);

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '100px' }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!document) {
    return (
      <div style={{ maxWidth: 800, margin: '40px auto', padding: 20, textAlign: 'center' }}>
        <h2>Document not found!</h2>
        <Button onClick={() => navigate('/documents')}>Return to List</Button>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '20px 16px' }}>
      <Button 
        type="text"
        icon={<ArrowLeft size={16} />} 
        onClick={() => navigate('/documents')} 
        style={{ marginBottom: 20, paddingLeft: 0 }}
      >
        Back to Documents
      </Button>

      <DocumentHeader title={document.title} subject={document.subject} tags={document.tags} />
      
      {document.content && document.content.length > 0 && (
        <>
          <DocumentTOC parts={document.content} />
          <DocumentBody parts={document.content} />
        </>
      )}
    </div>
  );
};

export default DocumentDetail;