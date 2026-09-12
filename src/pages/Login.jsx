// src/pages/Login.jsx
import React, { useState, useEffect } from 'react';
import { Card, Typography, Select, Input, Button, message } from 'antd';
import { User, Lock, ShieldCheck, LogIn, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { loginUser } from '../firebase/userService';

const { Title, Text } = Typography;
const { Option } = Select;

const Login = () => {
  const [role, setRole] = useState('Student');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Xóa phiên làm việc cũ khi truy cập lại trang đăng nhập
  useEffect(() => {
    localStorage.removeItem('userSession');
    window.dispatchEvent(new Event('authChange'));
  }, []);

  const handleLogin = async () => {
    if (!username || !password) {
      message.error("Vui lòng nhập đầy đủ tên đăng nhập và mật khẩu");
      return;
    }
    setLoading(true);
    try {
      const result = await loginUser(username, password, role);

      if (result.success) {
        localStorage.setItem('userSession', JSON.stringify({
          isLoggedIn: true,
          ...result.user
        }));
        window.dispatchEvent(new Event('authChange'));
        message.success(`Chào mừng ${result.user.name || result.user.username}!`);

        if (role === 'Admin') {
          navigate('/admin');
        } else {
          navigate('/profile');
        }
      } else {
        message.error(result.message || "Tên đăng nhập hoặc mật khẩu không chính xác");
      }
    } catch (error) {
      console.error("Login error:", error);
      message.error("Không thể kết nối đến máy chủ.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card
        className="w-full max-w-[400px] border-0 shadow-2xl rounded-3xl"
        style={{
          backgroundColor: 'rgba(255, 255, 255, 0.94)',
          backdropFilter: 'blur(16px)',
          padding: '12px 6px',
        }}
      >
        {/* Header Logo & Title */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 mx-auto mb-3 rounded-2xl bg-gradient-to-tr from-orange-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-blue-500/30 text-white">
            <User size={32} strokeWidth={2.2} />
          </div>
          
        </div>

        {/* Input Form */}
        <div className="flex flex-col gap-4">
          <div>
            <span className="text-xs font-semibold text-slate-600 mb-1.5 block">
              Tên đăng nhập
            </span>
            <Input
              size="large"
              placeholder="Nhập tên đăng nhập của bạn..."
              prefix={<User size={18} className="text-slate-400 mr-1" />}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              onPressEnter={handleLogin}
              className="rounded-xl h-12"
            />
          </div>

          <div>
            <span className="text-xs font-semibold text-slate-600 mb-1.5 block">
              Mật khẩu
            </span>
            <Input.Password
              size="large"
              placeholder="Nhập mật khẩu..."
              prefix={<Lock size={18} className="text-slate-400 mr-1" />}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onPressEnter={handleLogin}
              className="rounded-xl h-12"
            />
          </div>

          {/* Vai trò (Role) chuyển xuống dưới */}
          <div>
            <span className="text-xs font-semibold text-slate-600 mb-1.5 block">
              Vai trò tài khoản
            </span>
            <Select
              value={role}
              onChange={setRole}
              size="large"
              className="w-full"
              suffixIcon={<ShieldCheck size={16} className="text-slate-400" />}
            >
              <Option value="Student">Học sinh (Student)</Option>
              <Option value="Admin">Quản trị viên (Admin)</Option>
            </Select>
          </div>

          {/* Submit Button */}
          <Button
            type="primary"
            size="large"
            onClick={handleLogin}
            loading={loading}
            icon={<LogIn size={18} />}
            className="w-full h-12 rounded-xl mt-2 font-semibold text-base bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 border-0 shadow-lg shadow-blue-500/25"
          >
            Đăng nhập
          </Button>

          {/* Back Home */}
          <Button
            type="text"
            icon={<ArrowLeft size={16} />}
            onClick={() => navigate('/')}
            className="text-slate-500 hover:text-slate-800 rounded-xl mt-1"
          >
            Quay về trang chủ
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default Login;