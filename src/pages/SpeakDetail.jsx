import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Result, Button, Spin } from 'antd';
import SpeakSession from '../components/SpeakSession';
import { getSpeakById } from '../firebase/speakService';

const SpeakDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      const res = await getSpeakById(id);
      setData(res);
      setLoading(false);
    };
    fetch();
  }, [id]);

  if (loading) return <Spin size="large" style={{ display: 'block', margin: '100px auto' }} />;

  if (!data) return (
    <Result
      status="404"
      title="Set Not Found"
      extra={<Button type="primary" onClick={() => navigate('/speaks')}>Back to List</Button>}
    />
  );

  return (
    <SpeakSession 
      data={data} 
      onHome={() => navigate('/speaks')} 
    />
  );
};

export default SpeakDetail;