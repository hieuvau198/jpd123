import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Card, Typography, Row, Col, Button } from 'antd';
import { BookOpen, FileQuestion, Wrench, Settings } from 'lucide-react';

const { Title, Text } = Typography;

const Home = () => {
  const navigate = useNavigate();

  return (
    <div style={{ maxWidth: 1000, margin: '40px auto', padding: 20 }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: 50 }}>
        <Title level={1}>English Practice Hub</Title>
        <Text type="secondary" style={{ fontSize: '1.2rem' }}>Select a mode to start learning</Text>
      </div>

      <Row gutter={[24, 24]} justify="center">
        {/* Flashcards */}
        <Col xs={24} sm={8}>
          <Link to="/flashcards" style={{ textDecoration: 'none' }}>
            <Card hoverable style={{ textAlign: 'center', height: '100%', borderRadius: 12 }}>
              <div style={{ marginBottom: 20 }}>
                <BookOpen size={48} color="#1890ff" />
              </div>
              <Title level={3} style={{ color: '#1890ff' }}>Flashcards</Title>
              <Text type="secondary">Memorize vocabulary with flip cards.</Text>
            </Card>
          </Link>
        </Col>

        {/* Quizzes */}
        <Col xs={24} sm={8}>
          <Link to="/quizzes" style={{ textDecoration: 'none' }}>
            <Card hoverable style={{ textAlign: 'center', height: '100%', borderRadius: 12 }}>
              <div style={{ marginBottom: 20 }}>
                <FileQuestion size={48} color="#52c41a" />
              </div>
              <Title level={3} style={{ color: '#52c41a' }}>Quizzes</Title>
              <Text type="secondary">Test your knowledge with multiple choice.</Text>
            </Card>
          </Link>
        </Col>

        {/* Repairs (New Feature) */}
        <Col xs={24} sm={8}>
          <Link to="/repairs" style={{ textDecoration: 'none' }}>
            <Card hoverable style={{ textAlign: 'center', height: '100%', borderRadius: 12, border: '1px solid #f0f0f0' }}>
              <div style={{ marginBottom: 20 }}>
                <Wrench size={48} color="#722ed1" />
              </div>
              <Title level={3} style={{ color: '#722ed1' }}>Repair</Title>
              <Text type="secondary">Fix sentence order and grammar.</Text>
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