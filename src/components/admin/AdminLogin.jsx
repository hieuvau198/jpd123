import React, { useState } from 'react';
import { Card, Typography, Input, Button, message } from 'antd';
import { Lock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const { Title } = Typography;

const AdminLogin = ({ onLoginSuccess }) => {
  const [passcode, setPasscode] = useState('');
  const navigate = useNavigate();

  const handleLogin = () => {
    if (passcode === '2000') {
      message.success("Access Granted");
      onLoginSuccess();
    } else {
      message.error("Incorrect Passcode");
    }
  };

  return (
    <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f0f2f5' }}>
      <Card style={{ width: 350, textAlign: 'center' }}>
        <div style={{ marginBottom: 20 }}>
          <Lock size={40} color="#1890ff" />
          <Title level={3} style={{ marginTop: 10 }}>Admin Access</Title>
        </div>
        <Input.Password 
          placeholder="Enter Passcode" 
          size="large"
          style={{ marginBottom: 20 }}
          value={passcode}
          onChange={(e) => setPasscode(e.target.value)}
          onPressEnter={handleLogin}
        />
        <Button type="primary" block size="large" onClick={handleLogin}>Unlock</Button>
        <Button type="link" onClick={() => navigate('/')} style={{ marginTop: 10 }}>Back to Home</Button>
      </Card>
    </div>
  );
};

export default AdminLogin;