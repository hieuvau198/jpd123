import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { Result, Button, Spin } from 'antd';
import { getChemistryById } from '../firebase/chemistryService';
import ChemQuizSession from '../components/chem_quiz/ChemQuizSession';

const ChemQuizDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  const numbersParam = searchParams.get('numbers');
  const initialNumbers = numbersParam ? parseInt(numbersParam, 10) : null;

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      const res = await getChemistryById(id);
      setData(res);
      setLoading(false);
    };
    fetch();
  }, [id]);

  if (loading) return <Spin size="large" style={{ display: 'block', margin: '100px auto' }} />;

  if (!data) return (
    <Result
      status="404"
      title="Chemistry Quiz Not Found"
      extra={<Button type="primary" onClick={() => navigate('/chem-quizzes')}>Back to List</Button>}
    />
  );

  return (
    <ChemQuizSession 
      data={data} 
      onHome={() => navigate('/chem-quizzes')} 
      initialNumbers={initialNumbers} 
    />
  );
};

export default ChemQuizDetail;