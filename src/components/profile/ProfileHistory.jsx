// src/components/profile/ProfileHistory.jsx
import React, { useEffect, useState } from 'react';
import { Card, Table, Typography, Tag } from 'antd';
import { Award, RotateCcw, Coins } from 'lucide-react';
import { getUserHistory } from '../../firebase/historyService';

const { Title, Text } = Typography;

const ProfileHistory = ({ user }) => {
  const [historyData, setHistoryData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      if (!user?.id) return;
      setLoading(true);
      const practicesMap = await getUserHistory(user.id);
      
      // Convert map to array and sort by most recently accessed
      const practicesArray = Object.values(practicesMap).sort((a, b) => {
        return new Date(b.lastAccessed) - new Date(a.lastAccessed);
      });
      
      setHistoryData(practicesArray);
      setLoading(false);
    };

    fetchHistory();
  }, [user]);

  const columns = [
    {
      title: 'Practice Details',
      key: 'practice_details',
      render: (_, record) => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <Text strong style={{ fontSize: 'clamp(13px, 3.5vw, 15px)', color: '#262626' }}>
            {record.name || 'Unknown Practice'}
          </Text>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
            <Tag color="blue" style={{ margin: 0, fontSize: '11px', lineHeight: '18px' }}>
              {record.type || 'Practice'}
            </Tag>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: '12px', color: '#8c8c8c' }}>
              <RotateCcw size={12} /> {record.attempts || 1} {record.attempts === 1 ? 'try' : 'tries'}
            </span>
          </div>
        </div>
      ),
    },
    {
      title: 'Performance',
      key: 'performance',
      align: 'right',
      width: 140,
      render: (_, record) => {
        const score = record.completion || 0;
        const color = score >= 80 ? '#52c41a' : score >= 50 ? '#fa8c16' : '#ff4d4f';

        return (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 3 }}>
            <span style={{ color, fontWeight: 700, fontSize: 'clamp(14px, 4vw, 16px)' }}>
              {score}%
            </span>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 3, color: '#faad14', fontWeight: 600, fontSize: '12px' }}>
              <Coins size={13} />
              <span>+{record.earnedCoins || 0}</span>
            </div>
          </div>
        );
      },
    },
  ];

  return (
    <Card 
      title={<Title level={4} style={{ margin: 0, fontSize: '16px' }}>Practice History</Title>} 
      style={{ width: '100%', borderRadius: 12, boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}
      styles={{ body: { padding: '8px 12px' } }}
    >
      <Table 
        dataSource={historyData} 
        columns={columns} 
        rowKey="id" 
        loading={loading}
        pagination={{ pageSize: 5, size: 'small' }}
        showHeader={false}
        locale={{ emptyText: 'No practice history found.' }}
      />
    </Card>
  );
};

export default ProfileHistory;