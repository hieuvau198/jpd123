// src/components/admin/UserHistory/UserHistoryPage.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Typography, Card, Button, Table, Modal, Tag } from 'antd';
import { ArrowLeft, Eye } from 'lucide-react';
import { getAllUsers } from '../../../firebase/userService';
import { getAllHistories } from '../../../firebase/historyService';

const { Title } = Typography;

const UserHistoryPage = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState(null);
  const [isModalVisible, setIsModalVisible] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const [usersData, historiesData] = await Promise.all([
        getAllUsers(),
        getAllHistories()
      ]);

      const combinedData = usersData.map(user => {
        const userHistory = historiesData[user.id] || {};
        const practicesArray = Object.values(userHistory);
        const totalAttempts = practicesArray.reduce((sum, p) => sum + (p.attempts || 0), 0);
        const totalCoins = practicesArray.reduce((sum, p) => sum + (p.earnedCoins || 0), 0);
        
        // Sort practices by most recently accessed
        practicesArray.sort((a, b) => new Date(b.lastAccessed) - new Date(a.lastAccessed));

        return {
          ...user,
          totalAttempts,
          totalCoins,
          practices: practicesArray
        };
      });

      // Default sort by the most attempts
      combinedData.sort((a, b) => b.totalAttempts - a.totalAttempts);
      setUsers(combinedData);
      setLoading(false);
    };

    fetchData();
  }, []);

  const handleViewHistory = (user) => {
    setSelectedUser(user);
    setIsModalVisible(true);
  };

  const userColumns = [
    { 
      title: 'User', 
      dataIndex: 'name', 
      key: 'name', 
      render: (text) => <strong>{text}</strong> 
    },
    { 
      title: 'Role', 
      dataIndex: 'role', 
      key: 'role', 
      render: (role) => <Tag color={role === 'Admin' ? 'red' : 'blue'}>{role}</Tag> 
    },
    { 
      title: 'Total Attempts', 
      dataIndex: 'totalAttempts', 
      key: 'totalAttempts', 
      sorter: (a, b) => a.totalAttempts - b.totalAttempts 
    },
    { 
      title: 'Total Earned Coins', 
      dataIndex: 'totalCoins', 
      key: 'totalCoins', 
      sorter: (a, b) => a.totalCoins - b.totalCoins, 
      render: (coins) => <span style={{ color: '#faad14', fontWeight: 'bold' }}>{coins} 💰</span> 
    },
    { 
      title: 'Action', 
      key: 'action', 
      render: (_, record) => (
        <Button type="primary" icon={<Eye size={16} />} onClick={() => handleViewHistory(record)}>
          View History
        </Button>
      ) 
    }
  ];

  const historyColumns = [
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
      title: 'Coins Earned',
      dataIndex: 'earnedCoins',
      key: 'earnedCoins',
      render: (coins) => (
        <span style={{ color: '#faad14', fontWeight: 'bold' }}>
          {coins || 0} 💰
        </span>
      ),
    },
    {
      title: 'Attempts',
      dataIndex: 'attempts',
      key: 'attempts',
      render: (attempts) => <span>{attempts} {attempts === 1 ? 'time' : 'times'}</span>,
    },
  ];

  return (
    <div style={{ maxWidth: 1200, margin: '40px auto', padding: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 20, gap: '15px' }}>
        <Button icon={<ArrowLeft size={16} />} onClick={() => navigate('/admin/users')}></Button>
        <Title level={3} style={{ margin: 0 }}>All Users Practice History</Title>
      </div>

      <Card>
        <Table 
          columns={userColumns} 
          dataSource={users} 
          rowKey="id" 
          loading={loading} 
          pagination={{ pageSize: 10 }}
          scroll={{ x: true }}
        />
      </Card>

      <Modal
        title={selectedUser ? `${selectedUser.name}'s Practice History` : 'Practice History'}
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        footer={null}
        width={800}
      >
        <Table 
          dataSource={selectedUser?.practices || []} 
          columns={historyColumns} 
          rowKey="id" 
          pagination={{ pageSize: 5 }}
          scroll={{ x: true }}
        />
      </Modal>
    </div>
  );
};

export default UserHistoryPage;