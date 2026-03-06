import React from 'react';
import { Typography, Button, Card } from 'antd';
import { useNavigate } from 'react-router-dom';
import { User } from 'lucide-react';

const { Title, Text } = Typography;

const Profile = () => {
  const navigate = useNavigate();

  return (
    <div style={{ display: 'flex', justifyContent: 'center', marginTop: '50px' }}>
      <Card style={{ width: 400, textAlign: 'center', borderRadius: 12 }}>
        <User size={60} color="#52c41a" style={{ marginBottom: 10 }}/>
        <Title level={2}>Student Profile</Title>
        <Text type="secondary" style={{ display: 'block', marginBottom: 20 }}>
          Welcome back! You are logged in as a Student.
        </Text>
        
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
          <Button type="primary" onClick={() => navigate('/')}>
            Go to Home
          </Button>
          <Button danger onClick={() => navigate('/login')}>
            Logout
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default Profile;