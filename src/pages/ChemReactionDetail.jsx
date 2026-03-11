// src/pages/ChemReactionDetail.jsx
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { Spin, Result, Button } from 'antd';
import ChemReactionSession from '../components/chem_reaction/ChemReactionSession';
import { getChemReactionById } from '../firebase/chemReactionService';

const ChemReactionDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  const tag = searchParams.get('tag') || null;

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        setLoading(true);
        const res = await getChemReactionById(id);
        setData(res);
      } catch (error) {
        console.error("Error fetching chem reaction:", error);
        setData(null);
      } finally {
        setLoading(false);
      }
    };
    if (id) {
        fetch();
    }
  }, [id]);

  const handleBackToList = () => {
    navigate(tag ? `/chem-reaction?tag=${tag}` : '/chem-reaction');
  };

  if (loading) return <Spin size="large" style={{ display: 'block', margin: '100px auto' }} />;
  
  if (!data) return (
    <Result
      status="404"
      title="Set Not Found"
      subTitle="Sorry, the set you visited does not exist."
      extra={<Button type="primary" onClick={handleBackToList}>Back to List</Button>}
    />
  );

  return (
    <ChemReactionSession 
      data={data} 
      onHome={handleBackToList}
    />
  );
};

export default ChemReactionDetail;