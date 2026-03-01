import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'; // Import useSearchParams
import { Spin, Result, Button } from 'antd';
import FlashcardSession from '../components/FlashcardSession';
import { getFlashcardById } from '../firebase/flashcardService';

const FlashcardDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams(); // Get the search parameters
  const tag = searchParams.get('tag'); // Extract the tag
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      const res = await getFlashcardById(id);
      setData(res);
      setLoading(false);
    };
    fetch();
  }, [id]);

  // Helper function to return to the list page with the correct tag
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
      onHome={handleBackToList} // Use the helper to navigate back with the exact tag
    />
  );
};

export default FlashcardDetail;