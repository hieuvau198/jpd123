// src/pages/QuizDetail.jsx
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { Result, Button, Spin } from 'antd';
import QuizSession from '../components/QuizSession';
import QuizBSession from '../components/quiz_b/QuizBSession'; // <-- Thêm import này
import { getQuizById } from '../firebase/quizService';

const QuizDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
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

  // --- CHECK KIỂU QUIZ B ---
  if (data?.typeChildren === 'quiz-b') {
    return (
      <QuizBSession
        data={data}
        onHome={() => navigate('/quizzes')}
      />
    );
  }

  // Kiểu Quiz thông thường
  return (
    <QuizSession 
      data={data} 
      onHome={() => navigate('/quizzes')} 
      initialNumbers={initialNumbers}
    />
  );
};

export default QuizDetail;