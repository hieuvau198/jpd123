import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { Result, Button, Spin } from 'antd';
import OtherQuizSession from '../components/other_quiz/OtherQuizSession';
import { getOtherQuizById } from '../firebase/otherQuizService';

const OtherQuizDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  const numbersParam = searchParams.get('numbers');
  const initialNumbers = numbersParam ? parseInt(numbersParam, 10) : null;

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      const res = await getOtherQuizById(id);
      setData(res);
      setLoading(false);
    };
    fetch();
  }, [id]);

  if (loading) return <Spin size="large" style={{ display: 'block', margin: '100px auto' }} />;

  if (!data) return (
    <Result
      status="404"
      title="Practice Not Found"
      extra={<Button type="primary" onClick={() => navigate('/other-quizzes')}>Back to List</Button>}
    />
  );

  return (
    <OtherQuizSession 
      data={data} 
      onHome={() => navigate('/other-quizzes')} 
      initialNumbers={initialNumbers}
    />
  );
};

export default OtherQuizDetail;