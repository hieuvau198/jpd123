import React, { useState, useEffect } from 'react';
import { Card, Table, Tag, Button, Typography } from 'antd';
import { PlayCircle } from 'lucide-react';
import dayjs from 'dayjs';
import { useNavigate } from 'react-router-dom';
import { getUserMissions } from '../../firebase/missionService';

const { Title } = Typography;

// Helper to truncate long names to exactly 5 words (First 4 + ... + Last 1)
const truncateName = (name) => {
  if (!name) return 'Unknown Mission';
  const words = name.trim().split(/\s+/);
  if (words.length > 5) {
    const firstFour = words.slice(0, 4).join(' ');
    const lastWord = words[words.length - 1];
    return `${firstFour} ... ${lastWord}`;
  }
  return name;
};

const ProfileMissions = ({ currentUser }) => {
  const navigate = useNavigate();
  const [missions, setMissions] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
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
    // 1. Fixed plural paths to match App.jsx
    const routeMap = {
      'Flashcard': '/flashcard', 
      'Quiz': '/quiz',           
      'Phonetic': '/phonetic',
      'Repair': '/repair',       
      'Speak': '/speak',         
      'Defense': '/challenge'
    };
    
    const basePath = routeMap[mission.type];
    if (basePath) {
      // 2. Add the numbers parameter if targetQuestions exists
      const queryParam = mission.targetQuestions ? `?numbers=${mission.targetQuestions}` : '';
      
      // Navigate to the full URL (e.g., /flashcard/123?numbers=10)
      navigate(`${basePath}/${mission.practiceId}${queryParam}`);
    }
  };

  const columns = [
  { 
    title: 'Mission Name', 
    dataIndex: 'name', 
    key: 'name', 
    render: (text, record) => {
      // Calculate percentage string
      const pctValue = (typeof record.percentage === 'number' || !isNaN(Number(record.percentage))) 
        ? Number(record.percentage) * 100 
        : record.percentage;

      return (
        <div>
          <Typography.Text strong>
            {truncateName(text || record.practiceId)}
          </Typography.Text>
          <div style={{ marginTop: '4px', display: 'flex', gap: '4px', alignItems: 'center' }}>
            <Tag color="blue" style={{ fontSize: '11px' }}>
              {record.targetQuestions || 0} / {record.totalQuestions || 0}
            </Tag>
            <Tag 
              color={record.status === 'Đã chinh phục' ? 'green' : (record.status === 'Đang làm' ? 'orange' : 'default')}
              style={{ fontSize: '11px' }}
            >
              {record.status} {pctValue}%
            </Tag>
          </div>
        </div>
      );
    }
  },
  // Remove the 'Done' column object entirely from the array
  {
    title: 'Action',
    key: 'action',
    render: (_, record) => (
      <Button 
        type="primary" 
        size="small" 
        icon={<PlayCircle size={14} />} 
        onClick={() => handleGoToPractice(record)}
      />
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