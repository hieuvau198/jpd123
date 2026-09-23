// src/components/profile/ProfileMissions.jsx
import React, { useState, useEffect } from 'react';
import { Card, Table, Tag, Typography } from 'antd';
import dayjs from 'dayjs';
import { useNavigate } from 'react-router-dom';
import { Trophy } from 'lucide-react';
import { getUserMissions } from '../../firebase/missionService';

const { Title } = Typography;

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
    const routeMap = {
      'Flashcard': '/flashcard',
      'Quiz': '/quiz',
      'Phonetic': '/phonetic',
      'Repair': '/repair',
      'Speak': '/speak',
      'Defense': '/challenge',
      'Chem Quiz': '/chem-quiz',
      'Chem Reaction': '/chem-reaction'
    };
    const basePath = routeMap[mission.type];
    if (basePath) {
      const queryParam = mission.targetQuestions ? `?numbers=${mission.targetQuestions}` : '';
      navigate(`${basePath}/${mission.practiceId}${queryParam}`);
    }
  };

  const columns = [
    {
      title: 'Nhiệm vụ',
      dataIndex: 'name',
      key: 'name',
      render: (text, record) => {
        const pctValue = (typeof record.percentage === 'number' || !isNaN(Number(record.percentage)))
          ? Math.round(Number(record.percentage))
          : record.percentage;
        return (
          <div style={{ minWidth: 0, wordBreak: 'break-word' }}>
            <Typography.Text strong style={{ fontSize: 'clamp(12px, 3vw, 15px)', display: 'block', lineHeight: 1.3 }}>
              {truncateName(text || record.practiceId)}
            </Typography.Text>
            <div style={{ marginTop: '4px', display: 'flex', gap: '4px', alignItems: 'center', flexWrap: 'wrap' }}>
              <Tag color="blue" style={{ fontSize: '10px', lineHeight: '18px', padding: '0 4px', margin: 0 }}>
                {record.targetQuestions || 0}/{record.totalQuestions || 0}
              </Tag>
              <Tag
                color={record.status === 'Đã chinh phục' ? 'green' : (record.status === 'Đang làm' ? 'orange' : 'default')}
                style={{ fontSize: '10px', lineHeight: '18px', padding: '0 4px', margin: 0 }}
              >
                {record.status} {pctValue}%
              </Tag>
            </div>
          </div>
        );
      }
    },
    {
      title: 'Coin',
      key: 'coins',
      align: 'right',
      width: 70,
      render: (_, record) => (
        <div style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
          <Typography.Text strong style={{ color: '#faad14', fontSize: '13px' }}>
            {record.earning_coins || 0}/{record.max_coins || 0}
          </Typography.Text>
        </div>
      )
    }
  ];

  return (
    <Card
      style={{
        width: '100%',
        maxWidth: '100%',
        borderRadius: 12,
        boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
        boxSizing: 'border-box'
      }}
      styles={{ body: { padding: '8px 12px' } }}
    >
      <Table
        columns={columns}
        dataSource={missions}
        rowKey="id"
        loading={loading}
        size="small"
        pagination={{ pageSize: 5, size: 'small' }}
        locale={{ emptyText: "Hiện chưa có nhiệm vụ nào." }}
        onRow={(record) => ({
          onClick: () => handleGoToPractice(record),
          style: { cursor: 'pointer' }
        })}
      />
    </Card>
  );
};

export default ProfileMissions;