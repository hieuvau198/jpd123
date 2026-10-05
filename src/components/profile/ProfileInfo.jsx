// src/components/profile/ProfileInfo.jsx
import React, { useState, useEffect } from 'react';
import { Card, Typography, Button, Divider, Tag, Spin } from 'antd';
import { User, Trophy, Award, LogOut, Medal } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import TitleListModal from '../tittle/TitleListModal';
import titlesData from '../../data/system/titles.json';
import { getAllUsers } from '../../firebase/userService';

const { Title, Text } = Typography;

const ProfileInfo = ({ user }) => {
  const navigate = useNavigate();
  const [isTitleModalVisible, setIsTitleModalVisible] = useState(false);
  const [userRank, setUserRank] = useState(null);
  const [totalStudents, setTotalStudents] = useState(0);
  const [loadingRank, setLoadingRank] = useState(true);

  // Tính level và danh hiệu
  const userLevel = Math.floor((user?.personal_coins || 0) / 100) + 1;
  const userTitleObj = titlesData.find(t => userLevel >= t.minLevel && userLevel <= t.maxLevel);
  const userTitle = userTitleObj ? userTitleObj.title : "Unknown Scholar";

  // Lấy thứ hạng của học sinh trong hệ thống điểm (Coins)
  useEffect(() => {
    let isMounted = true;
    const calculateRank = async () => {
      if (!user?.id && !user?.username) {
        setLoadingRank(false);
        return;
      }

      setLoadingRank(true);
      try {
        const users = await getAllUsers();
        // Lọc các tài khoản học sinh (role !== 'Admin')
        const students = (users || []).filter(u => u.role !== 'Admin');
        
        // Sắp xếp theo personal_coins giảm dần
        students.sort((a, b) => (b.personal_coins || 0) - (a.personal_coins || 0));

        // Tìm vị trí của học sinh hiện tại (1-based index)
        const currentUserId = user.id || user.username;
        const rankIndex = students.findIndex(
          u => u.id === currentUserId || u.username === currentUserId
        );

        if (isMounted) {
          setUserRank(rankIndex !== -1 ? rankIndex + 1 : null);
          setTotalStudents(students.length);
        }
      } catch (error) {
        console.error("Lỗi khi tính thứ hạng học sinh:", error);
      } finally {
        if (isMounted) setLoadingRank(false);
      }
    };

    calculateRank();
    return () => {
      isMounted = false;
    };
  }, [user?.id, user?.username, user?.personal_coins]);

  const handleLogout = () => {
    localStorage.removeItem('userSession');
    window.dispatchEvent(new Event('authChange'));
    navigate('/login');
  };

  return (
    <Card style={{ flex: '1 1 300px', textAlign: 'center', borderRadius: 12, height: 'fit-content', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
      <User size={60} color="#52c41a" style={{ marginBottom: 10 }}/>
      <Title level={3} style={{ marginTop: 0, marginBottom: 8 }}> {user?.name || 'Student'}</Title>
      
      {/* Title & Level */}
      <Tag 
        icon={<Award size={14} style={{ marginRight: 4, verticalAlign: 'middle' }} />}
        color="magenta-inverse"
        style={{
          fontSize: '16px',
          padding: '4px 12px',
          borderRadius: '12px',
          marginBottom: 16,
          marginRight: 12,
          display: 'inline-flex',
          alignItems: 'center',
          boxShadow: '0 2px 6px rgba(250, 173, 20, 0.2)'
        }}
      >
        {userTitle}
      </Tag>
      <Tag 
        color="lime-inverse"
        style={{
          fontSize: '16px',
          padding: '4px 12px',
          borderRadius: '12px',
          marginBottom: 16,
          display: 'inline-flex',
          alignItems: 'center',
          boxShadow: '0 2px 6px rgba(250, 173, 20, 0.2)'
        }}
      >
        Level {userLevel}
      </Tag>
      
      {/* Khung hiển thị Coins & Thứ hạng */}
      <div style={{
        background: 'linear-gradient(135deg, #FFD700 0%, #FF8C00 100%)',
        borderRadius: '16px',
        padding: '16px 20px',
        color: 'white',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '12px',
        marginBottom: '24px',
        boxShadow: '0 4px 15px rgba(255, 140, 0, 0.3)'
      }}>
        {/* Phần Tổng Coins */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            backgroundColor: 'rgba(255,255,255,0.25)',
            borderRadius: '50%',
            padding: '10px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Trophy size={32} color="#fff" />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
            <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.9)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: 0.5 }}>
              Coins
            </span>
            <Title level={2} style={{ color: 'white', margin: 0, lineHeight: 1.1 }}>
              {user?.personal_coins?.toLocaleString() || 0}
            </Title>
          </div>
        </div>

        {/* Phần Thứ hạng */}
        <div style={{
          backgroundColor: 'rgba(255,255,255,0.2)',
          borderRadius: '12px',
          padding: '6px 14px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-end',
          minWidth: 80
        }}>
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
            fontSize: '11px',
            color: 'rgba(255,255,255,0.9)',
            fontWeight: 600,
            textTransform: 'uppercase'
          }}>
            <Medal size={13} /> Thứ hạng
          </span>
          {loadingRank ? (
            <Spin size="small" style={{ marginTop: 4 }} />
          ) : (
            <span style={{ fontSize: '20px', fontWeight: 800, lineHeight: 1.2 }}>
              {userRank ? `#${userRank}` : '--'}
              {totalStudents > 0 && (
                <span style={{ fontSize: '11px', fontWeight: 400, opacity: 0.85, marginLeft: 3 }}>
                  
                </span>
              )}
            </span>
          )}
        </div>
      </div>

      <Divider />
      
      <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
        <Button type="default" onClick={() => navigate('/')}>
          Home
        </Button>
        <Button type="primary" icon={<Award size={16} />} onClick={() => setIsTitleModalVisible(true)}>
          Titles
        </Button>
        <Button danger icon={<LogOut size={16} />} onClick={handleLogout}>
          Logout
        </Button>
      </div>

      <TitleListModal 
        visible={isTitleModalVisible}
        onClose={() => setIsTitleModalVisible(false)}
      />
    </Card>
  );
};

export default ProfileInfo;