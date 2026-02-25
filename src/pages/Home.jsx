import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Card, Typography, Row, Col, Button } from 'antd';
import { BookOpen, FileQuestion, Wrench, Settings, Mic, Shield, Swords } from 'lucide-react';

const { Title, Text } = Typography;

const Home = () => {
  const navigate = useNavigate();

  return (
    <div style={{ maxWidth: 1000, margin: '40px auto', padding: 20 }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: 50 }}>
        <Title level={1}>English Hub</Title>
      </div>

      <Row gutter={[24, 24]} justify="center">
        {/* Flashcards */}
        <Col xs={24} sm={8} md={6}>
          <Link to="/flashcards" style={{ textDecoration: 'none' }}>
            <Card hoverable style={{ textAlign: 'center', height: '100%', borderRadius: 12 }}>
              <div style={{ marginBottom: 20 }}>
                <BookOpen size={48} color="#1890ff" />
              </div>
              <Title level={3} style={{ color: '#1890ff' }}>Words</Title>
              <Text type="secondary">Memorize vocabulary.</Text>
            </Card>
          </Link>
        </Col>

        {/* Quizzes */}
        <Col xs={24} sm={8} md={6}>
          <Link to="/quizzes" style={{ textDecoration: 'none' }}>
            <Card hoverable style={{ textAlign: 'center', height: '100%', borderRadius: 12 }}>
              <div style={{ marginBottom: 20 }}>
                <FileQuestion size={48} color="#52c41a" />
              </div>
              <Title level={3} style={{ color: '#52c41a' }}>Grammar</Title>
              <Text type="secondary">Test your knowledge.</Text>
            </Card>
          </Link>
        </Col>

        {/* Repairs */}
        <Col xs={24} sm={8} md={6}>
          <Link to="/repairs" style={{ textDecoration: 'none' }}>
            <Card hoverable style={{ textAlign: 'center', height: '100%', borderRadius: 12 }}>
              <div style={{ marginBottom: 20 }}>
                <Wrench size={48} color="#722ed1" />
              </div>
              <Title level={3} style={{ color: '#722ed1' }}>Repair</Title>
              <Text type="secondary">Fix sentence order.</Text>
            </Card>
          </Link>
        </Col>

        {/* Speak */}
        <Col xs={24} sm={8} md={6}>
          <Link to="/speaks" style={{ textDecoration: 'none' }}>
            <Card hoverable style={{ textAlign: 'center', height: '100%', borderRadius: 12 }}>
              <div style={{ marginBottom: 20 }}>
                <Mic size={48} color="#eb2f96" />
              </div>
              <Title level={3} style={{ color: '#eb2f96' }}>Speak</Title>
              <Text type="secondary">Listen & Distinguish.</Text>
            </Card>
          </Link>
        </Col>

        {/* Defense (New Feature) */}
        <Col xs={24} sm={8} md={6}>
          <Link to="/defense" style={{ textDecoration: 'none' }}>
            <Card hoverable style={{ textAlign: 'center', height: '100%', borderRadius: 12, borderColor: '#ff4d4f' }}>
              <div style={{ marginBottom: 20 }}>
                <Swords size={48} color="#ff4d4f" />
              </div>
              <Title level={3} style={{ color: '#ff4d4f' }}>Challenge</Title>
              <Text type="secondary">Earn your Title</Text>
            </Card>
          </Link>
        </Col>
      </Row>

      {/* Admin Link */}
      <div style={{ textAlign: 'center', marginTop: 60 }}>
        <Button 
          type="text" 
          icon={<Settings size={14} />} 
          onClick={() => navigate('/admin')}
          style={{ color: '#999' }}
        >
          Admin Dashboard
        </Button>
      </div>
    </div>
  );
};

export default Home;