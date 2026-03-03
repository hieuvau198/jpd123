import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { Result, Button, Spin } from 'antd';
import QuizSession from '../components/QuizSession';
import { getQuizById } from '../firebase/quizService';

const QuizDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  // Extract the "numbers" parameter if it exists
  const numbersParam = searchParams.get('numbers');
  const initialNumbers = numbersParam ? parseInt(numbersParam, 10) : null;

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
      initialNumbers={initialNumbers} // Pass down the initial numbers
    />
  );
};

export default QuizDetail;