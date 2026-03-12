// src/components/profile/ProfileInfo.jsx
import React, { useState } from 'react';
import { Card, Typography, Button, Divider, Tag } from 'antd';
import { User, Trophy, Award, BicepsFlexed } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import TitleListModal from '../tittle/TitleListModal';
import titlesData from '../../data/system/titles.json';

const { Title, Text } = Typography;

const ProfileInfo = ({ user }) => {
  const navigate = useNavigate();
  const [isTitleModalVisible, setIsTitleModalVisible] = useState(false);

  // Calculate level and find matching title
  const userLevel = Math.floor((user?.personal_coins || 0) / 100) + 1;
  const userTitleObj = titlesData.find(t => userLevel >= t.minLevel && userLevel <= t.maxLevel);
  const userTitle = userTitleObj ? userTitleObj.title : "Unknown Scholar";

  return (
    <Card style={{ flex: '1 1 300px', textAlign: 'center', borderRadius: 12, height: 'fit-content', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
      <User size={60} color="#52c41a" style={{ marginBottom: 10 }}/>
      <Title level={3} style={{ marginTop: 0, marginBottom: 8 }}> {user?.name || 'Student'}</Title>
      
      {/* Beautiful Title Display */}
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
        <Button type="primary" icon={<Award size={16} />} onClick={() => setIsTitleModalVisible(true)}>
          Titles
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