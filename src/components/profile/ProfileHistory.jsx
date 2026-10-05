// src/components/profile/ProfileHistory.jsx
import React, { useEffect, useState } from 'react';
import { Card, Table, Typography, Tag, Space } from 'antd';
import { Award, RotateCcw, Coins, BookOpen, Layers } from 'lucide-react';
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

  // Tính tổng số bài đã làm và tổng số lượt thử
  const totalPractices = historyData.length;
  const totalAttempts = historyData.reduce(
    (sum, record) => sum + (Number(record.attempts) || 1),
    0
  );

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
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                fontSize: '12px',
                color: '#6b7280',
                backgroundColor: '#f3f4f6',
                padding: '1px 6px',
                borderRadius: '6px',
              }}
            >
              <RotateCcw size={12} /> {record.attempts || 1} lần làm
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
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 3,
                color: '#faad14',
                fontWeight: 600,
                fontSize: '12px',
              }}
            >
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
      title={
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 8,
          }}
        >
          <Title level={4} style={{ margin: 0, fontSize: '16px' }}>
            Lịch sử làm bài
          </Title>

          {/* Badge thống kê tổng số bài và tổng số lần làm */}
          {!loading && (
            <Space size={6} wrap>
              <Tag
                color="cyan"
                style={{
                  margin: 0,
                  fontSize: '12px',
                  borderRadius: 8,
                  padding: '2px 8px',
                }}
              >
                Tổng bài: <b>{totalPractices}</b>
              </Tag>
              <Tag
                color="purple"
                style={{
                  margin: 0,
                  fontSize: '12px',
                  borderRadius: 8,
                  padding: '2px 8px',
                }}
              >
                Số lần làm bài: <b>{totalAttempts}</b>
              </Tag>
            </Space>
          )}
        </div>
      }
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
        locale={{ emptyText: 'Chưa có lịch sử làm bài nào.' }}
      />
    </Card>
  );
};

export default ProfileHistory;