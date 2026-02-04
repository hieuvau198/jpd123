import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Card, Button, Spin, Typography, Row, Col, Tag } from 'antd';
import { Wrench, ArrowLeft } from 'lucide-react';
import { getAllRepairs } from '../firebase/repairService';

const { Title } = Typography;

const RepairList = () => {
  const [repairs, setRepairs] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchRepairs = async () => {
      const data = await getAllRepairs();
      setRepairs(data);
      setLoading(false);
    };
    fetchRepairs();
  }, []);

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
      </div>

      <Row gutter={[16, 16]}>
        {repairs.map((set) => (
          <Col xs={24} sm={12} md={8} key={set.id}>
            <Link to={`/repair/${set.id}`} style={{ textDecoration: 'none' }}>
              <Card hoverable style={{ height: '100%', borderRadius: 12, borderTop: '4px solid #722ed1' }}>
                <Title level={4}>{set.title}</Title>
                <Tag color="purple">{set.questions?.length || 0} Questions</Tag>
                <div style={{ marginTop: 10, color: '#666' }}>
                   {set.subject && <Tag>{set.subject}</Tag>}
                </div>
              </Card>
            </Link>
          </Col>
        ))}
      </Row>
    </div>
  );
};

export default RepairList;