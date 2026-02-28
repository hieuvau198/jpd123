// src/pages/PhoneticList.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Typography, Button, Spin, Empty, Tag } from 'antd';
import { ArrowLeft, Volume2 } from 'lucide-react';
import { getAllPhonetics } from '../firebase/phoneticService';

const { Title, Text } = Typography;

const PhoneticList = () => {
  const [sets, setSets] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchSets = async () => {
      const data = await getAllPhonetics();
      setSets(data);
      setLoading(false);
    };
    fetchSets();
  }, []);

  if (loading) {
    return <div style={{ textAlign: 'center', marginTop: '50px' }}><Spin size="large" /></div>;
  }

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: '20px' }}>
      <Button icon={<ArrowLeft size={16} />} onClick={() => navigate('/')} style={{ marginBottom: 20 }}>
        Back to Home
      </Button>
      
      <Title level={2} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <Volume2 color="#fa541c" /> Phonetic Practice
      </Title>

      {sets.length === 0 ? (
        <Empty description="No phonetic sets available." />
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '20px' }}>
          {sets.map((set) => (
            <Card 
              key={set.id} 
              hoverable 
              onClick={() => navigate(`/phonetic/${set.id}`)}
              style={{ borderRadius: 12, borderTop: '4px solid #fa541c' }}
            >
              <Title level={4}>{set.title}</Title>
              <Text type="secondary" style={{ display: 'block', marginBottom: 10 }}>{set.description}</Text>
              <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
                <Tag color="volcano">{set.subject}</Tag>
                {set.questions && <Tag>{set.questions.length} Qs</Tag>}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default PhoneticList;