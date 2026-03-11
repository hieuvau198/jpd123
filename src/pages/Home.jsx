// src/pages/Home.jsx
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Card, Typography, Row, Col, List, Avatar, Spin, Badge } from 'antd';
import { 
  BookOpen, FileQuestion, Wrench, Mic, Swords, 
  FlaskConical, Beaker, Trophy, Flame, Sparkles 
} from 'lucide-react';
import { getTopUsersByCoins } from '../firebase/userService';

const { Title, Text } = Typography;

const Home = () => {
  const navigate = useNavigate();
  const [loggedInUser, setLoggedInUser] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [loadingLeaderboard, setLoadingLeaderboard] = useState(true);

  useEffect(() => {
    // 1. Load User Session
    try {
      const storedUser = JSON.parse(localStorage.getItem('userSession'));
      if (storedUser) {
        setLoggedInUser(storedUser);
      }
    } catch (e) {
      console.error("Failed to read user from localStorage", e);
    }

    // 2. Load Leaderboard
    const fetchLeaderboard = async () => {
      setLoadingLeaderboard(true);
      const topUsers = await getTopUsersByCoins(5); // Fetch top 5 students
      setLeaderboard(topUsers);
      setLoadingLeaderboard(false);
    };

    fetchLeaderboard();
  }, []);

  // Helper function to render beautiful rank badges
  const renderRankBadge = (index) => {
    if (index === 0) return <span style={{ fontSize: '28px', textShadow: '0 0 10px gold' }}>🥇</span>;
    if (index === 1) return <span style={{ fontSize: '28px', textShadow: '0 0 10px silver' }}>🥈</span>;
    if (index === 2) return <span style={{ fontSize: '28px', textShadow: '0 0 10px #cd7f32' }}>🥉</span>;
    return (
      <div style={{ 
        width: 30, height: 30, borderRadius: '50%', backgroundColor: '#f0f2f5', 
        display: 'flex', alignItems: 'center', justifyContent: 'center', 
        fontWeight: 'bold', color: '#595959', fontSize: '16px', border: '2px solid #d9d9d9'
      }}>
        {index + 1}
      </div>
    );
  };

  return (
    <div style={{ maxWidth: 1200, margin: '40px auto', padding: 20, position: 'relative' }}>
      
      <div style={{ textAlign: 'center', marginBottom: 40, marginTop: 20 }}>
        <Title level={1}>🗿 Study Hub 🗿</Title>
        <Text type="secondary" style={{ fontSize: '18px' }}>Choose your path and climb the ranks!</Text>
      </div>

      <Row gutter={[32, 32]}>
        
        {/* Left Column: Activities Grid (Takes up 16/24 columns on large screens) */}
        <Col xs={24} lg={16}>
          <Title level={3} style={{ marginBottom: 20, color: '#262626' }}>
            <Sparkles size={24} style={{ marginRight: 8, verticalAlign: 'middle', color: '#faad14' }} />
            Activities
          </Title>
          <Row gutter={[20, 20]}>
            <Col xs={24} sm={12} md={8}>
              <Link to="/flashcards" style={{ textDecoration: 'none' }}>
                <Card hoverable style={{ textAlign: 'center', height: '100%', borderRadius: 16, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
                  <BookOpen size={48} color="#1890ff" style={{ marginBottom: 16 }} />
                  <Title level={4} style={{ color: '#1890ff', margin: 0 }}>Words</Title>
                  <Text type="secondary">Memorize vocabulary.</Text>
                </Card>
              </Link>
            </Col>

            <Col xs={24} sm={12} md={8}>
              <Link to="/quizzes" style={{ textDecoration: 'none' }}>
                <Card hoverable style={{ textAlign: 'center', height: '100%', borderRadius: 16, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
                  <FileQuestion size={48} color="#52c41a" style={{ marginBottom: 16 }} />
                  <Title level={4} style={{ color: '#52c41a', margin: 0 }}>Grammar</Title>
                  <Text type="secondary">Test your knowledge.</Text>
                </Card>
              </Link>
            </Col>

            <Col xs={24} sm={12} md={8}>
              <Link to="/repairs" style={{ textDecoration: 'none' }}>
                <Card hoverable style={{ textAlign: 'center', height: '100%', borderRadius: 16, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
                  <Wrench size={48} color="#722ed1" style={{ marginBottom: 16 }} />
                  <Title level={4} style={{ color: '#722ed1', margin: 0 }}>Repair</Title>
                  <Text type="secondary">Fix sentence order.</Text>
                </Card>
              </Link>
            </Col>

            <Col xs={24} sm={12} md={8}>
              <Link to="/phonetic" style={{ textDecoration: 'none' }}>
                <Card hoverable style={{ textAlign: 'center', height: '100%', borderRadius: 16, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
                  <Mic size={48} color="#2febe2" style={{ marginBottom: 16 }} />
                  <Title level={4} style={{ color: '#2febe2', margin: 0 }}>Phonetic</Title>
                  <Text type="secondary">Identify Sounds.</Text>
                </Card>
              </Link>
            </Col>

            <Col xs={24} sm={12} md={8}>
              <Link to="/speaks" style={{ textDecoration: 'none' }}>
                <Card hoverable style={{ textAlign: 'center', height: '100%', borderRadius: 16, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
                  <Mic size={48} color="#eb2f96" style={{ marginBottom: 16 }} />
                  <Title level={4} style={{ color: '#eb2f96', margin: 0 }}>Speak</Title>
                  <Text type="secondary">Listen & Distinguish.</Text>
                </Card>
              </Link>
            </Col>

            <Col xs={24} sm={12} md={8}>
              <Link to="/challenge" style={{ textDecoration: 'none' }}>
                <Card hoverable style={{ textAlign: 'center', height: '100%', borderRadius: 16, border: '2px solid #ff4d4f', boxShadow: '0 4px 12px rgba(255,77,79,0.15)' }}>
                  <Swords size={48} color="#ff4d4f" style={{ marginBottom: 16 }} />
                  <Title level={4} style={{ color: '#ff4d4f', margin: 0 }}>Challenge</Title>
                  <Text type="secondary">Earn your Title</Text>
                </Card>
              </Link>
            </Col>

            <Col xs={24} sm={12} md={8}>
              <Link to="/chem-quiz" style={{ textDecoration: 'none' }}>
                <Card hoverable style={{ textAlign: 'center', height: '100%', borderRadius: 16, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
                  <FlaskConical size={48} color="#13c2c2" style={{ marginBottom: 16 }} />
                  <Title level={4} style={{ color: '#13c2c2', margin: 0 }}>Chem Quiz</Title>
                  <Text type="secondary">Test your Chem skills</Text>
                </Card>
              </Link>
            </Col>

            <Col xs={24} sm={12} md={8}>
              <Link to="/chem-reaction" style={{ textDecoration: 'none' }}>
                <Card hoverable style={{ textAlign: 'center', height: '100%', borderRadius: 16, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
                  <Beaker size={48} color="#fa8c16" style={{ marginBottom: 16 }} />
                  <Title level={4} style={{ color: '#fa8c16', margin: 0 }}>Reactions</Title>
                  <Text type="secondary">Master equations</Text>
                </Card>
              </Link>
            </Col>
          </Row>
        </Col>

        {/* Right Column: Leaderboard (Takes up 8/24 columns on large screens) */}
        <Col xs={24} lg={8}>
          <Title level={3} style={{ marginBottom: 20, color: '#262626' }}>
            <Trophy size={24} style={{ marginRight: 8, verticalAlign: 'middle', color: '#fadb14' }} />
            Hall of Fame
          </Title>
          
          <Card 
            style={{ 
              borderRadius: 20, 
              background: 'linear-gradient(145deg, #ffffff, #f0f5ff)',
              boxShadow: '0 10px 25px rgba(24, 144, 255, 0.15)',
              border: '1px solid #d6e4ff'
            }}
            bodyStyle={{ padding: '24px 16px' }}
          >
            {loadingLeaderboard ? (
              <div style={{ textAlign: 'center', padding: '40px 0' }}>
                <Spin size="large" />
                <p style={{ marginTop: 10, color: '#8c8c8c' }}>Gathering the champions...</p>
              </div>
            ) : (
              <List
                itemLayout="horizontal"
                dataSource={leaderboard}
                renderItem={(user, index) => (
                  <List.Item 
                    style={{ 
                      borderBottom: 'none', 
                      padding: '12px 16px',
                      background: index === 0 ? 'linear-gradient(90deg, #fffbe6, #fff1b8)' : 'transparent',
                      borderRadius: 12,
                      marginBottom: 8,
                      transition: 'transform 0.2s',
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
                    onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                  >
                    <List.Item.Meta
                      avatar={
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          {renderRankBadge(index)}
                          <Avatar 
                            size={46} 
                            style={{ 
                              backgroundColor: index === 0 ? '#faad14' : '#1890ff',
                              border: index === 0 ? '2px solid #ffe58f' : 'none'
                            }}
                          >
                            {user.name?.charAt(0).toUpperCase()}
                          </Avatar>
                        </div>
                      }
                      title={
                        <Text strong style={{ fontSize: '16px', color: index === 0 ? '#d48806' : '#262626' }}>
                          {user.name || 'Unknown Scholar'}
                        </Text>
                      }
                      description={
                        <Text style={{ color: '#595959', fontWeight: '500' }}>
                          <Flame size={14} color="#ff4d4f" style={{ marginRight: 4, verticalAlign: 'middle' }} />
                          Level {Math.floor((user.personal_coins || 0) / 100) + 1}
                        </Text>
                      }
                    />
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#fa8c16' }}>
                        {user.personal_coins || 0}
                      </div>
                      <div style={{ fontSize: '12px', color: '#8c8c8c' }}>Coins 🪙</div>
                    </div>
                  </List.Item>
                )}
              />
            )}
          </Card>
        </Col>

      </Row>
    </div>
  );
};

export default Home;