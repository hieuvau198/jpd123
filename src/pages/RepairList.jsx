import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Card, Button, Spin, Typography, Row, Col, Tag, Space } from 'antd';
import { Wrench, ArrowLeft, Filter } from 'lucide-react';
import { getAllRepairs } from '../firebase/repairService';
import availableTags from '../data/system/tags.json'; // Import tags

const { Title } = Typography;
const { CheckableTag } = Tag;

const RepairList = () => {
  const [repairs, setRepairs] = useState([]);
  const [loading, setLoading] = useState(true);
  // Default to the first tag found in the JSON, otherwise 'all'
  const [selectedTag, setSelectedTag] = useState(availableTags.length > 0 ? availableTags[0].id : 'all');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchRepairs = async () => {
      const data = await getAllRepairs();
      setRepairs(data);
      setLoading(false);
    };
    fetchRepairs();
  }, []);

  // Filter logic
  const filteredRepairs = selectedTag === 'all' 
    ? repairs 
    : repairs.filter(item => item.tags && item.tags.includes(selectedTag));

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', marginTop: 50 }}><Spin size="large" /></div>;

  return (
    <div style={{ maxWidth: 1000, margin: '20px auto', padding: 20 }}>
      <Button icon={<ArrowLeft size={16} />} onClick={() => navigate('/')} style={{ marginBottom: 20 }}>Back to Home</Button>
      
      <div style={{ textAlign: 'center', marginBottom: 40 }}>
        <Title level={2}>
          <Wrench style={{ verticalAlign: 'middle', marginRight: 10 }} color="#722ed1" />
          Sentence Repair Practice
        </Title>
        <p>Reorder the words to form correct sentences.</p>

        {/* Filter Section */}
        <div style={{ marginTop: 24 }}>
          <Space wrap size={[8, 8]} justify="center" align="center">
            <span style={{ display: 'flex', alignItems: 'center', marginRight: 8, fontWeight: 500 }}>
               <Filter size={16} style={{ marginRight: 6 }} /> Filter by:
            </span>
            
            <CheckableTag
              checked={selectedTag === 'all'}
              onChange={() => setSelectedTag('all')}
              style={{ 
                border: '1px solid #d9d9d9', 
                padding: '4px 12px', 
                fontSize: '14px',
                cursor: 'pointer' 
              }}
            >
              All
            </CheckableTag>

            {availableTags.map((tag) => (
              <CheckableTag
                key={tag.id}
                checked={selectedTag === tag.id}
                onChange={() => setSelectedTag(tag.id)}
                style={{ 
                  border: '1px solid #d9d9d9', 
                  padding: '4px 12px', 
                  fontSize: '14px', 
                  cursor: 'pointer'
                }}
              >
                {tag.name}
              </CheckableTag>
            ))}
          </Space>
        </div>
      </div>

      <Row gutter={[16, 16]}>
        {filteredRepairs.length > 0 ? (
          filteredRepairs.map((set) => (
            <Col xs={24} sm={12} md={8} key={set.id}>
              <Link to={`/repair/${set.id}`} style={{ textDecoration: 'none' }}>
                <Card hoverable style={{ height: '100%', borderRadius: 12, borderTop: '4px solid #722ed1' }}>
                  <Title level={4}>{set.title}</Title>
                  
                  <div style={{ marginBottom: 12 }}>
                    <Tag color="purple">{set.questions?.length || 0} Questions</Tag>
                  </div>

                  <div style={{ color: '#666' }}>
                     {/* Display Subject */}
                     {set.subject && <Tag color="blue">{set.subject}</Tag>}
                     
                     {/* Display Tags */}
                     {set.tags && set.tags.map((tag, index) => (
                       <Tag key={index} color="cyan">{tag}</Tag>
                     ))}
                  </div>
                </Card>
              </Link>
            </Col>
          ))
        ) : (
          <Col span={24}>
            <div style={{ textAlign: 'center', padding: '40px 0', color: '#999', fontSize: '16px' }}>
              No repairs found for this category.
            </div>
          </Col>
        )}
      </Row>
    </div>
  );
};

export default RepairList;