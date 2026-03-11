import React from 'react';
import { Card, Typography, Button, Divider } from 'antd';
import { User, Coins, Trophy } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const { Title, Text } = Typography;

const ProfileInfo = ({ user }) => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('userId'); // Fallback removal
    localStorage.removeItem('userSession'); // Since Profile.jsx handles this session logic
    navigate('/login');
  };

  return (
    <Card style={{ flex: '1 1 300px', textAlign: 'center', borderRadius: 12, height: 'fit-content', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
      <User size={60} color="#52c41a" style={{ marginBottom: 10 }}/>
      <Title level={3} style={{ marginTop: 0 }}> {user?.name || 'Student'}</Title>
      <Text type="secondary" style={{ display: 'block', marginBottom: 20 }}>
        Welcome back
      </Text>
      
      {/* Beautiful Coins Display */}
      <div style={{
        background: 'linear-gradient(135deg, #FFD700 0%, #FF8C00 100%)',
        borderRadius: '16px',
        padding: '16px 20px',
        color: 'white',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '16px',
        marginBottom: '24px',
        boxShadow: '0 4px 15px rgba(255, 140, 0, 0.3)'
      }}>
        <div style={{
          backgroundColor: 'rgba(255,255,255,0.2)',
          borderRadius: '50%',
          padding: '10px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <Trophy size={36} color="#fff" />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
          <Text style={{ color: 'rgba(255,255,255,0.9)', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 'bold' }}>
          </Text>
          <Title level={2} style={{ color: 'white', margin: 0, lineHeight: 1 }}>
            {user?.personal_coins?.toLocaleString() || 0}
          </Title>
        </div>
      </div>

      <Divider />
      
      <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
        <Button type="default" onClick={() => navigate('/')}>
          Home
        </Button>
        <Button danger onClick={handleLogout}>
          Logout
        </Button>
      </div>
    </Card>
  );
};

export default ProfileInfo;