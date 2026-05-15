// src/pages/Home.jsx
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Card, Typography, Row, Col } from 'antd';
import { 
  BookOpen, FileQuestion, Wrench, Mic, Swords, 
  FlaskConical, Beaker, Sparkles, Puzzle,
  FileText
} from 'lucide-react';
import HallOfFame from '../components/HallOfFame'; 

const { Title } = Typography;

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

  return (
    <div style={{ maxWidth: 1200, margin: '40px auto', padding: 20, position: 'relative' }}>
      
      <div style={{ textAlign: 'center', marginBottom: 40, marginTop: 20 }}>
        <Title level={1}>🗿🗿🗿🗿🗿</Title>
      </div>

      <Row gutter={[32, 32]}>
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
                  <Title level={3} style={{ color: '#1890ff', margin: 0 }}>Words</Title>
                </Card>
              </Link>
            </Col>

            <Col xs={24} sm={12} md={8}>
              <Link to="/quizzes" style={{ textDecoration: 'none' }}>
                <Card hoverable style={{ textAlign: 'center', height: '100%', borderRadius: 16, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
                  <FileQuestion size={48} color="#52c41a" style={{ marginBottom: 16 }} />
                  <Title level={3} style={{ color: '#52c41a', margin: 0 }}>Grammar</Title>
                </Card>
              </Link>
            </Col>

            

            <Col xs={24} sm={12} md={8}>
              <Link to="/repairs" style={{ textDecoration: 'none' }}>
                <Card hoverable style={{ textAlign: 'center', height: '100%', borderRadius: 16, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
                  <Wrench size={48} color="#722ed1" style={{ marginBottom: 16 }} />
                  <Title level={3} style={{ color: '#722ed1', margin: 0 }}>Repair</Title>
                </Card>
              </Link>
            </Col>

            <Col xs={24} sm={12} md={8}>
              <Link to="/phonetic" style={{ textDecoration: 'none' }}>
                <Card hoverable style={{ textAlign: 'center', height: '100%', borderRadius: 16, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
                  <Mic size={48} color="#2febe2" style={{ marginBottom: 16 }} />
                  <Title level={3} style={{ color: '#2febe2', margin: 0 }}>Phonetic</Title>
                </Card>
              </Link>
            </Col>

            <Col xs={24} sm={12} md={8}>
              <Link to="/speaks" style={{ textDecoration: 'none' }}>
                <Card hoverable style={{ textAlign: 'center', height: '100%', borderRadius: 16, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
                  <Mic size={48} color="#eb2f96" style={{ marginBottom: 16 }} />
                  <Title level={3} style={{ color: '#eb2f96', margin: 0 }}>Speak</Title>
                </Card>
              </Link>
            </Col>

            <Col xs={24} sm={12} md={8}>
              <Link to="/challenge" style={{ textDecoration: 'none' }}>
                <Card hoverable style={{ textAlign: 'center', height: '100%', borderRadius: 16, border: '2px solid #ff4d4f', boxShadow: '0 4px 12px rgba(255,77,79,0.15)' }}>
                  <Swords size={48} color="#ff4d4f" style={{ marginBottom: 16 }} />
                  <Title level={3} style={{ color: '#ff4d4f', margin: 0 }}>Challenge</Title>
                </Card>
              </Link>
            </Col>

            <Col xs={24} sm={12} md={8}>
              <Link to="/chem-quiz" style={{ textDecoration: 'none' }}>
                <Card hoverable style={{ textAlign: 'center', height: '100%', borderRadius: 16, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
                  <FlaskConical size={48} color="#13c2c2" style={{ marginBottom: 16 }} />
                  <Title level={3} style={{ color: '#13c2c2', margin: 0 }}>Chem Quiz</Title>
                </Card>
              </Link>
            </Col>

            <Col xs={24} sm={12} md={8}>
              <Link to="/chem-reaction" style={{ textDecoration: 'none' }}>
                <Card hoverable style={{ textAlign: 'center', height: '100%', borderRadius: 16, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
                  <Beaker size={48} color="#fa8c16" style={{ marginBottom: 16 }} />
                  <Title level={3} style={{ color: '#fa8c16', margin: 0 }}>Reactions</Title>
                </Card>
              </Link>
            </Col>

            <Col xs={24} sm={12} md={8}>
              <Link to="/documents" style={{ textDecoration: 'none' }}>
                <Card hoverable style={{ textAlign: 'center', height: '100%', borderRadius: 16, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
                  <FileText size={48} color="#1cebfa" style={{ marginBottom: 16 }} />
                  <Title level={3} style={{ color: '#1cebfa', margin: 0 }}>Documents</Title>
                </Card>
              </Link>
            </Col>

            <Col xs={24} sm={12} md={8}>
              <Link to="/other-quizzes" style={{ textDecoration: 'none' }}>
                <Card hoverable style={{ textAlign: 'center', height: '100%', borderRadius: 16, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
                  <Puzzle size={48} color="#fa541c" style={{ marginBottom: 16 }} />
                  <Title level={3} style={{ color: '#fa541c', margin: 0 }}>Other</Title>
                </Card>
              </Link>
            </Col>

          </Row>
        </Col>

        {/* Right Column: Leaderboard */}
        <Col xs={24} lg={8}>
          <HallOfFame />
        </Col>

      </Row>
    </div>
  );
};

export default Home;