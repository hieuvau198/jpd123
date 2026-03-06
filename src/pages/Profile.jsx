import React, { useState, useEffect } from 'react';
import { Typography, Button, Card, Table, Tag } from 'antd';
import { useNavigate } from 'react-router-dom';
import { User, PlayCircle } from 'lucide-react';
import dayjs from 'dayjs';
import { getUserMissions } from '../firebase/missionService'; // Make sure the path is correct

const { Title, Text } = Typography;

const Profile = ({ currentUser }) => {
  const navigate = useNavigate();
  const [missions, setMissions] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // TODO: Replace with your actual state/auth logic to get the logged-in user's ID
    const userId = currentUser?.id || localStorage.getItem('userId'); 
    
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
    // Map mission types to their respective frontend routes
    const routeMap = {
      'Flashcard': '/flashcard',
      'Quiz': '/quiz',
      'Phonetic': '/phonetic',
      'Repair': '/repair',
      'Speak': '/speak',
      'Defense': '/defense'
    };
    
    const basePath = routeMap[mission.type];
    if (basePath) {
      navigate(`${basePath}/${mission.practiceId}`);
    }
  };

  const columns = [
    { title: 'Type', dataIndex: 'type', key: 'type', render: (t) => <Tag>{t}</Tag> },
    { title: 'Practice Target', dataIndex: 'practiceId', key: 'practiceId' },
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
          Go to Practice
        </Button>
      ),
    }
  ];

  return (
    <div style={{ padding: '40px 20px', maxWidth: 1100, margin: '0 auto' }}>
      <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
        
        {/* Profile Card */}
        <Card style={{ flex: '1 1 300px', textAlign: 'center', borderRadius: 12, height: 'fit-content' }}>
          <User size={60} color="#52c41a" style={{ marginBottom: 10 }}/>
          <Title level={3}>Student Profile</Title>
          <Text type="secondary" style={{ display: 'block', marginBottom: 20 }}>
            Welcome back! You are logged in as a Student.
          </Text>
          
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
            <Button type="default" onClick={() => navigate('/')}>
              Go to Home
            </Button>
            <Button danger onClick={() => navigate('/login')}>
              Logout
            </Button>
          </div>
        </Card>

        {/* Missions List Card */}
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

      </div>
    </div>
  );
};

export default Profile;