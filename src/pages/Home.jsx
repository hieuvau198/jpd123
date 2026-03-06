// src/pages/Home.jsx
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Card, Typography, Row, Col, Button } from 'antd';
// Imported ShieldCheck for Admin icon
import { BookOpen, FileQuestion, Wrench, Settings, Mic, Shield, Swords, User, ShieldCheck } from 'lucide-react'; 

const { Title, Text } = Typography;

const Home = () => {
  const navigate = useNavigate();
  const [loggedInUser, setLoggedInUser] = useState(null);

  useEffect(() => {
    try {
      const storedUser = JSON.parse(localStorage.getItem('userSession'));
      if (storedUser) {
        setLoggedInUser(storedUser);
      }
    } catch (e) {
      console.error("Failed to read user from localStorage", e);
    }
  }, []);

  const handleAuthNavigation = () => {
    if (!loggedInUser) {
      navigate('/login');
    } else if (loggedInUser.role === 'Admin') {
      navigate('/admin'); // Or wherever your admin dashboard is located
    } else {
      navigate('/profile');
    }
  };

  const getButtonConfig = () => {
    if (!loggedInUser) {
      return { label: 'Login', icon: <User size={16} /> };
    } else if (loggedInUser.role === 'Admin') {
      return { label: 'Admin', icon: <ShieldCheck size={16} /> };
    } else {
      return { label: 'Profile', icon: <User size={16} /> };
    }
  };

  const btnConfig = getButtonConfig();

  return (
    <div style={{ maxWidth: 1000, margin: '40px auto', padding: 20, position: 'relative' }}>
      
      {/* Dynamic Login/Profile/Admin Button */}
      <div style={{ position: 'absolute', top: 20, right: 20, zIndex: 10 }}>
        <Button 
          type="primary" 
          onClick={handleAuthNavigation}
          style={{ display: 'flex', alignItems: 'center', gap: 5 }}
        >
          {btnConfig.icon} {btnConfig.label}
        </Button>
      </div>

      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: 50, marginTop: 40 }}>
        <Title level={1}>🗿🗿🗿</Title>
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

        {/* Phonetic */}
        <Col xs={24} sm={8} md={6}>
          <Link to="/phonetic" style={{ textDecoration: 'none' }}>
            <Card hoverable style={{ textAlign: 'center', height: '100%', borderRadius: 12 }}>
              <div style={{ marginBottom: 20 }}>
                <Mic size={48} color="#2febe2" />
              </div>
              <Title level={3} style={{ color: '#2febe2' }}>Phonetic</Title>
              <Text type="secondary">Identify Sounds.</Text>
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
          <Link to="/challenge" style={{ textDecoration: 'none' }}>
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
    </div>
  );
};

export default Home;