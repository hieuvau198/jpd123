// src/components/HallOfFame.jsx
import React, { useState, useEffect } from 'react';
import { Card, Typography, List, Avatar, Spin, Button, Tooltip } from 'antd';
import { Trophy, Flame, ChevronLeft, ChevronRight, Award } from 'lucide-react';
import { getTopUsersByCoins } from '../firebase/userService';
import TitleListModal from './tittle/TitleListModal'; // Import the new modal

const { Title, Text } = Typography;

// Helper function to format the name (Last Word + First Word)
const formatDisplayName = (fullName) => {
  if (!fullName) return 'Unknown Scholar';
  
  const parts = fullName.trim().split(/\s+/);
  if (parts.length <= 1) return fullName; // If it's a single word, just return it
  
  // Return last word + space + first word
  return `${parts[parts.length - 1]} ${parts[0]}`;
};

const HallOfFame = () => {
  const [leaderboard, setLeaderboard] = useState([]);
  const [loadingLeaderboard, setLoadingLeaderboard] = useState(true);
  const [isTitleModalVisible, setIsTitleModalVisible] = useState(false); // Modal state
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(0);
  const itemsPerPage = 5;

  useEffect(() => {
    const fetchLeaderboard = async () => {
      setLoadingLeaderboard(true);
      const topUsers = await getTopUsersByCoins(15); // Fetch top 15 students
      setLeaderboard(topUsers);
      setLoadingLeaderboard(false);
    };

    fetchLeaderboard();
  }, []);

  const renderRankBadge = (globalIndex) => {
    if (globalIndex === 0) return <span style={{ fontSize: '28px', textShadow: '0 0 10px gold' }}>🥇</span>;
    if (globalIndex === 1) return <span style={{ fontSize: '28px', textShadow: '0 0 10px silver' }}>🥈</span>;
    if (globalIndex === 2) return <span style={{ fontSize: '28px', textShadow: '0 0 10px #cd7f32' }}>🥉</span>;
    return (
      <div style={{ 
        width: 30, height: 30, borderRadius: '50%', backgroundColor: '#f0f2f5', 
        display: 'flex', alignItems: 'center', justifyContent: 'center', 
        fontWeight: 'bold', color: '#595959', fontSize: '16px', border: '2px solid #d9d9d9'
      }}>
        {globalIndex + 1}
      </div>
    );
  };

  // Pagination logic
  const displayedUsers = leaderboard.slice(currentPage * itemsPerPage, (currentPage + 1) * itemsPerPage);
  const totalPages = Math.ceil(leaderboard.length / itemsPerPage);

  const handlePrevPage = () => {
    if (currentPage > 0) setCurrentPage(currentPage - 1);
  };

  const handleNextPage = () => {
    if (currentPage < totalPages - 1) setCurrentPage(currentPage + 1);
  };

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', marginBottom: 44, position: 'relative' }}>
        <Title
          level={3}
          style={{
            margin: 0,
            color: "#262626",
            display: "flex",
            alignItems: "center",
            gap: 8
          }}
        >
          <Trophy size={24} style={{ color: "#fadb14" }} />
          Hall of Fame
        </Title>
        
        {/* Title List Button overlayed on the right */}
        <Tooltip title="View Title Ranks">
          <Button 
            type="dashed" 
            shape="circle"
            icon={<Award size={18} color="#faad14" />} 
            onClick={() => setIsTitleModalVisible(true)}
            style={{ position: 'absolute', right: 0 }}
          />
        </Tooltip>
      </div>
      
      <Card 
        style={{ 
          borderRadius: 20, 
          background: 'linear-gradient(145deg, #ffffff, #f0f5ff)',
          boxShadow: '0 10px 25px rgba(24, 144, 255, 0.15)',
          border: '1px solid #d6e4ff'
        }}
        styles={{ body: { padding: '24px 16px' } }}
      >
        {loadingLeaderboard ? (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <Spin size="large" />
            <p style={{ marginTop: 10, color: '#8c8c8c' }}>Gathering the champions...</p>
          </div>
        ) : (
          <>
            <List
              itemLayout="horizontal"
              dataSource={displayedUsers}
              renderItem={(user, index) => {
                const globalIndex = currentPage * itemsPerPage + index; // Calculate actual rank (0-14)
                
                return (
                  <List.Item 
                    style={{ 
                      borderBottom: 'none', 
                      padding: '12px 16px',
                      background: globalIndex === 0 ? 'linear-gradient(90deg, #fffbe6, #fff1b8)' : 'transparent',
                      borderRadius: 12,
                      marginBottom: 8,
                      transition: 'transform 0.2s',
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
                    onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                  >
                    <List.Item.Meta
                      avatar={
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          {renderRankBadge(globalIndex)}
                          <Avatar 
                            size={46} 
                            style={{ 
                              backgroundColor: globalIndex === 0 ? '#faad14' : '#1890ff',
                              border: globalIndex === 0 ? '2px solid #ffe58f' : 'none'
                            }}
                          >
                            {user.name?.charAt(0).toUpperCase() || '?'}
                          </Avatar>
                        </div>
                      }
                      title={
                        <Text strong style={{ fontSize: '16px', color: globalIndex === 0 ? '#d48806' : '#262626' }}>
                          {formatDisplayName(user.name)}
                        </Text>
                      }
                      description={
                        <Text style={{ color: '#595959', fontWeight: '500' }}>
                          <Flame size={14} color="#ff4d4f" style={{ marginRight: 4, verticalAlign: 'middle' }} />
                          Level {Math.floor((user.personal_coins || 0) / 100) + 1}
                        </Text>
                      }
                    />
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#fa8c16' }}>
                        {user.personal_coins || 0}
                      </div>
                      <div style={{ fontSize: '12px', color: '#8c8c8c' }}>Coins 🪙</div>
                    </div>
                  </List.Item>
                );
              }}
            />
            
            {/* Pagination Controls */}
            {leaderboard.length > itemsPerPage && (
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 16, marginTop: 16 }}>
                <Button 
                  shape="circle" 
                  icon={<ChevronLeft size={18} />} 
                  onClick={handlePrevPage} 
                  disabled={currentPage === 0}
                />
                <Text style={{ color: '#8c8c8c', fontWeight: 500 }}>
                  {currentPage + 1}/{totalPages}
                </Text>
                <Button 
                  shape="circle" 
                  icon={<ChevronRight size={18} />} 
                  onClick={handleNextPage} 
                  disabled={currentPage >= totalPages - 1}
                />
              </div>
            )}
          </>
        )}
      </Card>

      <TitleListModal 
        visible={isTitleModalVisible} 
        onClose={() => setIsTitleModalVisible(false)} 
      />
    </>
  );
};

export default HallOfFame;