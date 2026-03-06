import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { Spin, Result, Button } from 'antd';
import FlashcardSession from '../components/flashcard/FlashcardSession';
import { getFlashcardById } from '../firebase/flashcardService';

const FlashcardDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  // Explicitly fallback to null if not found
  const tag = searchParams.get('tag') || null;
  
  // Extract the "numbers" parameter if it exists safely
  const numbersParam = searchParams.get('numbers');
  const initialNumbers = numbersParam && !isNaN(parseInt(numbersParam, 10)) 
    ? parseInt(numbersParam, 10) 
    : null;

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        setLoading(true);
        const res = await getFlashcardById(id);
        setData(res);
      } catch (error) {
        console.error("Error fetching flashcard:", error);
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
    navigate(tag ? `/flashcards?tag=${tag}` : '/flashcards');
  };

  if (loading) return <Spin size="large" style={{ display: 'block', margin: '100px auto' }} />;
  
  if (!data) return (
    <Result
      status="404"
      title="Flashcard Not Found"
      subTitle="Sorry, the set you visited does not exist."
      extra={<Button type="primary" onClick={handleBackToList}>Back to List</Button>}
    />
  );

  return (
    <FlashcardSession 
      data={data} 
      onHome={handleBackToList}
      initialNumbers={initialNumbers} // Pass down the initial numbers
    />
  );
};

export default FlashcardDetail;