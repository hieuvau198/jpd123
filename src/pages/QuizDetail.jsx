import React, { useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Result, Button } from 'antd';
import QuizSession from '../components/QuizSession';

const QuizDetail = ({ quizData }) => {
  const { id } = useParams();
  const navigate = useNavigate();

  const data = useMemo(() => {
    return quizData.find(q => String(q.id) === String(id));
  }, [quizData, id]);

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