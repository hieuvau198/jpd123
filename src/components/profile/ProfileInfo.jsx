import React from 'react';
import { Card, Typography, Button } from 'antd';
import { User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const { Title, Text } = Typography;

const ProfileInfo = ({ user }) => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('userId'); // Fallback removal
    navigate('/login');
  };

  return (
    <Card style={{ flex: '1 1 300px', textAlign: 'center', borderRadius: 12, height: 'fit-content' }}>
      <User size={60} color="#52c41a" style={{ marginBottom: 10 }}/>
      <Title level={3}>Student Profile</Title>
      <Text type="secondary" style={{ display: 'block', marginBottom: 20 }}>
        Welcome back, {user?.name || 'Student'}!
      </Text>
      
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