// src/pages/DocumentList.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Typography, Card, Spin, Row, Col, Tag, Button } from 'antd';
import { ArrowLeft, FileText } from 'lucide-react';
import { getAllDocuments } from '../firebase/documentService';

const { Title, Text } = Typography;

const DocumentList = () => {
  const navigate = useNavigate();
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDocs = async () => {
      setLoading(true);
      const data = await getAllDocuments();
      setDocuments(data);
      setLoading(false);
    };
    fetchDocs();
  }, []);

  return (
    <div style={{ maxWidth: 1000, margin: '40px auto', padding: 20 }}>
      <Button 
        icon={<ArrowLeft size={16} />} 
        onClick={() => navigate('/')} 
        style={{ marginBottom: 20 }}
      >
        Back to Home
      </Button>

      <Title level={2} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <FileText color="#1890ff" /> Documents
      </Title>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '50px' }}>
          <Spin size="large" />
        </div>
      ) : (
        <Row gutter={[16, 16]}>
          {documents.map((doc) => (
            <Col xs={24} sm={12} md={8} key={doc.id}>
              <Card 
                hoverable 
                onClick={() => navigate(`/documents/${doc.id}`)}
                style={{ height: '100%' }}
              >
                <Title level={4}>{doc.title}</Title>
                <Text type="secondary">{doc.id}</Text>
                <div style={{ marginTop: 10 }}>
                  {doc.subject && <Tag color="blue">{doc.subject}</Tag>}
                </div>
              </Card>
            </Col>
          ))}
          {documents.length === 0 && (
            <Col span={24}>
              <Text type="secondary">No documents found.</Text>
            </Col>
          )}
        </Row>
      )}
    </div>
  );
};

export default DocumentList;