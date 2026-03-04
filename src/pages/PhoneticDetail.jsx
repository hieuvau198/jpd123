// src/pages/PhoneticDetail.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Spin, Button, Typography } from 'antd';
import { ArrowLeft } from 'lucide-react';
import { getPhoneticById } from '../firebase/phoneticService';
import PhoneticSession from '../components/PhoneticSession';

const { Title } = Typography;

const PhoneticDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      const result = await getPhoneticById(id);
      setData(result);
      setLoading(false);
    };
    loadData();
  }, [id]);

  if (loading) {
    return <div style={{ textAlign: 'center', marginTop: '100px' }}><Spin size="large" /></div>;
  }

  if (!data) {
    return <div style={{ textAlign: 'center', marginTop: '50px' }}>Set not found</div>;
  }

  return (
    <div>
      <PhoneticSession data={data} onFinish={() => navigate('/phonetic')} />
    </div>
  );
};

export default PhoneticDetail;