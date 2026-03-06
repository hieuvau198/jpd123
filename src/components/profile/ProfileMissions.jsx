import React, { useState, useEffect } from 'react';
import { Card, Table, Tag, Button, Typography } from 'antd';
import { PlayCircle } from 'lucide-react';
import dayjs from 'dayjs';
import { useNavigate } from 'react-router-dom';
import { getUserMissions } from '../../firebase/missionService';

const { Title } = Typography;

const ProfileMissions = ({ currentUser }) => {
  const navigate = useNavigate();
  const [missions, setMissions] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Robustly check for the user's ID
    let userId = currentUser?.id;
    
    if (!userId) {
      try {
        const storedUser = JSON.parse(localStorage.getItem('user'));
        userId = storedUser?.id || localStorage.getItem('userId');
      } catch (e) {
        userId = localStorage.getItem('userId');
      }
    }

    if (userId) {
      fetchMissions(userId);
    }
  }, [currentUser]);

  const fetchMissions = async (userId) => {
    setLoading(true);
    try {
      const data = await getUserMissions(userId);
      setMissions(data);
    } catch (error) {
      console.error("Failed to load missions", error);
    } finally {
      setLoading(false);
    }
  };

  const handleGoToPractice = (mission) => {
    // Fixed paths to match the routes defined in Home.jsx
    const routeMap = {
      'Flashcard': '/flashcards',
      'Quiz': '/quizzes',
      'Phonetic': '/phonetic',
      'Repair': '/repairs',
      'Speak': '/speaks',
      'Defense': '/challenge'
    };
    
    const basePath = routeMap[mission.type];
    if (basePath) {
      navigate(`${basePath}/${mission.practiceId}`);
    }
  };

  const columns = [
    { title: 'Type', dataIndex: 'type', key: 'type', render: (t) => <Tag>{t}</Tag> },
    { title: 'Practice', dataIndex: 'practiceId', key: 'practiceId' },
    { 
      title: 'Status', 
      dataIndex: 'status', 
      key: 'status',
      render: (status) => {
        const color = status === 'Đã chinh phục' ? 'green' : (status === 'Đang làm' ? 'orange' : 'default');
        return <Tag color={color}>{status}</Tag>;
      }
    },
    { title: 'Progress (%)', dataIndex: 'percentage', key: 'percentage' },
    { 
      title: 'Deadline', 
      dataIndex: 'endDate', 
      key: 'endDate', 
      render: (date) => date ? dayjs(date).format('DD/MM/YYYY') : 'N/A' 
    },
    {
      title: 'Action',
      key: 'action',
      render: (_, record) => (
        <Button 
          type="primary" 
          size="small" 
          icon={<PlayCircle size={14} />} 
          onClick={() => handleGoToPractice(record)}
        >
          Practice
        </Button>
      ),
    }
  ];

  return (
    <Card 
      style={{ flex: '2 1 600px', borderRadius: 12 }} 
      title={<Title level={4} style={{ margin: 0 }}>My Missions</Title>}
    >
      <Table 
        columns={columns} 
        dataSource={missions} 
        rowKey="id" 
        loading={loading} 
        size="middle" 
        scroll={{ x: true }}
        pagination={{ pageSize: 5 }}
        locale={{ emptyText: "You have no assigned missions right now." }}
      />
    </Card>
  );
};

export default ProfileMissions;