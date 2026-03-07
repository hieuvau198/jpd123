import React, { useState, useEffect } from 'react';
import { Card, Typography, Select, Input, Button, message } from 'antd';
import { User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { loginUser } from '../firebase/userService';

const { Title } = Typography;
const { Option } = Select;

const Login = () => {
  const [role, setRole] = useState('Student');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Clear any existing session when accessing the login page manually
  useEffect(() => {
    localStorage.removeItem('userSession');
    window.dispatchEvent(new Event('authChange')); // Notify NavBar on manual visit
  }, []);

  const handleLogin = async () => {
    if (!username || !password) {
      message.error("Please enter both username and password");
      return;
    }

    setLoading(true);
    try {
      const result = await loginUser(username, password, role);
      
      if (result.success) {
        // Save session data
        localStorage.setItem('userSession', JSON.stringify({
          isLoggedIn: true,
          ...result.user
        }));

        // 🔥 ADD THIS LINE to trigger the NavBar update automatically
        window.dispatchEvent(new Event('authChange'));

        message.success(`Welcome back, ${result.user.name}!`);
        
        if (role === 'Admin') {
          navigate('/admin');
        } else {
          navigate('/profile');
        }
      } else {
        message.error(result.message);
      }
    } catch (error) {
      message.error("Failed to connect to the server.");
    } finally {
      setLoading(false);
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

        <Input 
          placeholder="Username" 
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          style={{ marginBottom: 15 }} 
          size="large" 
        />
        <Input.Password 
          placeholder="Password" 
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onPressEnter={handleLogin}
          style={{ marginBottom: 20 }} 
          size="large" 
        />

        <Button type="primary" block size="large" onClick={handleLogin} loading={loading}>
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