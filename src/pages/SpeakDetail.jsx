import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Result, Button, Spin, Card, Typography, Row, Col } from 'antd';
import { CustomerServiceOutlined, ThunderboltOutlined } from '@ant-design/icons';
import SpeakSession from '../components/SpeakSession';
import { getSpeakById } from '../firebase/speakService';

const { Title, Text } = Typography;

const SpeakDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState(null); // 'listen' | 'stress'

  useEffect(() => {
    const fetch = async () => {
      const res = await getSpeakById(id);
      setData(res);
      setLoading(false);
    };
    fetch();
  }, [id]);

  if (loading) return <Spin size="large" style={{ display: 'block', margin: '100px auto' }} />;

  if (!data) return (
    <Result
      status="404"
      title="Set Not Found"
      extra={<Button type="primary" onClick={() => navigate('/speaks')}>Back to List</Button>}
    />
  );

  // Mode Selection Screen
  if (!mode) {
    return (
      <div style={{ padding: '40px 20px', maxWidth: 800, margin: '0 auto' }}>
        <Button onClick={() => navigate('/speaks')} style={{ marginBottom: 20 }}>Back</Button>
        <Title level={2} style={{ textAlign: 'center', marginBottom: 40 }}>Choose Practice Mode</Title>
        <Row gutter={[24, 24]} justify="center">
          <Col xs={24} sm={12}>
            <Card 
              hoverable 
              onClick={() => setMode('listen')}
              style={{ textAlign: 'center', height: '100%', border: '2px solid #f0f0f0' }}
              bodyStyle={{ padding: '40px 20px' }}
            >
              <CustomerServiceOutlined style={{ fontSize: 48, color: '#eb2f96', marginBottom: 20 }} />
              <Title level={3}>Listen & Select</Title>
              <Text type="secondary">Listen to the word and select the correct option.</Text>
            </Card>
          </Col>
          <Col xs={24} sm={12}>
            <Card 
              hoverable 
              onClick={() => setMode('stress')}
              style={{ textAlign: 'center', height: '100%', border: '2px solid #f0f0f0' }}
              bodyStyle={{ padding: '40px 20px' }}
            >
              <ThunderboltOutlined style={{ fontSize: 48, color: '#1890ff', marginBottom: 20 }} />
              <Title level={3}>Stress</Title>
              <Text type="secondary">Listen to all variations and identify the correct pronunciation.</Text>
            </Card>
          </Col>
        </Row>
      </div>
    );
  }

  return (
    <SpeakSession 
      data={data} 
      mode={mode}
      onHome={() => navigate('/speaks')} 
    />
  );
};

export default SpeakDetail;