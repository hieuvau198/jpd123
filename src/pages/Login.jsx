import React, { useState } from 'react';
import { Card, Typography, Select, Input, Button, message } from 'antd';
import { User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const { Title } = Typography;
const { Option } = Select;

const Login = () => {
  const [role, setRole] = useState('Student');
  const navigate = useNavigate();

  const handleLogin = () => {
    // You can replace this with actual Firebase authentication later
    message.success(`Logging in as ${role}...`);
    
    // Check role and route accordingly
    if (role === 'Admin') {
      navigate('/admin');
    } else {
      navigate('/profile');
    }
  };

  return (
    <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f0f2f5' }}>
      <Card style={{ width: 350, textAlign: 'center' }}>
        <div style={{ marginBottom: 20 }}>
          <User size={40} color="#1890ff" />
          <Title level={3} style={{ marginTop: 10 }}>Login</Title>
        </div>

        <Select 
          value={role} 
          onChange={setRole} 
          style={{ width: '100%', marginBottom: 15 }}
          size="large"
        >
          <Option value="Student">Student</Option>
          <Option value="Admin">Admin</Option>
        </Select>

        <Input placeholder="Username (Optional)" style={{ marginBottom: 15 }} size="large" />
        <Input.Password placeholder="Password (Optional)" style={{ marginBottom: 20 }} size="large" />

        <Button type="primary" block size="large" onClick={handleLogin}>
          Sign In
        </Button>
        <Button type="link" onClick={() => navigate('/')} style={{ marginTop: 10 }}>
          Back to Home
        </Button>
      </Card>
    </div>
  );
};

export default Login;