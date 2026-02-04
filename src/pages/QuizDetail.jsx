import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Result, Button, Spin } from 'antd';
import QuizSession from '../components/QuizSession';
import { getQuizById } from '../firebase/quizService';

const QuizDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      const res = await getQuizById(id);
      setData(res);
      setLoading(false);
    };
    fetch();
  }, [id]);

  if (loading) return <Spin size="large" style={{ display: 'block', margin: '100px auto' }} />;

  if (!data) return (
    <Result
      status="404"
      title="Quiz Not Found"
      extra={<Button type="primary" onClick={() => navigate('/quizzes')}>Back to List</Button>}
    />
  );

  return (
    <QuizSession 
      data={data} 
      onHome={() => navigate('/quizzes')} 
    />
  );
};

export default QuizDetail;