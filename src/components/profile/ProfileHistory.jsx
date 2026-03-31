// src/components/profile/ProfileHistory.jsx
import React, { useEffect, useState } from 'react';
import { Card, Table, Typography, Tag } from 'antd';
import { getUserHistory } from '../../firebase/historyService';

const { Title } = Typography;

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
      title: 'Practice Name',
      dataIndex: 'name',
      key: 'name',
      render: (text) => <strong style={{ color: '#333' }}>{text}</strong>,
    },
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
      render: (type) => <Tag color="blue">{type}</Tag>,
    },
    {
      title: 'Best Score',
      dataIndex: 'completion',
      key: 'completion',
      render: (score) => {
        let color = score >= 80 ? 'green' : score >= 50 ? 'orange' : 'red';
        return <span style={{ color, fontWeight: 'bold' }}>{score}%</span>;
      },
    },
    {
      title: 'Attempts',
      dataIndex: 'attempts',
      key: 'attempts',
      render: (attempts) => <span>{attempts} {attempts === 1 ? 'time' : 'times'}</span>,
    },
  ];

  return (
    <Card 
      title={<Title level={4} style={{ margin: 0 }}>Practice History</Title>} 
      style={{ flex: '1 1 100%', borderRadius: 12, boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}
    >
      <Table 
        dataSource={historyData} 
        columns={columns} 
        rowKey="id" 
        loading={loading}
        pagination={{ pageSize: 5 }}
        scroll={{ x: true }}
      />
    </Card>
  );
};

export default ProfileHistory;