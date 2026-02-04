import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { List, Spin, Button } from 'antd';
import { Home } from 'lucide-react';
import { getAllFlashcards } from '../firebase/flashcardService';
import PracticeCard from '../components/PracticeCard';

const FlashcardList = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetch = async () => {
      const res = await getAllFlashcards();
      setData(res);
      setLoading(false);
    };
    fetch();
  }, []);

  return (
    <div className="app-container">
      <div className="home-header">
        <Button type="text" icon={<Home size={16}/>} onClick={() => navigate('/')}>
           Back Home
        </Button>
        <h2>Flashcard Library</h2>
      </div>

      {loading ? <Spin size="large" style={{display:'block', margin:'50px auto'}} /> : (
        <List
          grid={{ gutter: 16, xs: 1, sm: 2, md: 3, lg: 3, xl: 3, xxl: 4 }}
          pagination={{
            position: 'bottom',
            align: 'center',
            pageSize: 9, // Items per page
          }}
          dataSource={data}
          renderItem={(item) => (
            <List.Item>
              <PracticeCard 
                practice={item} 
                onClick={() => navigate(`/flashcard/${item.id}`)} 
              />
            </List.Item>
          )}
        />
      )}
    </div>
  );
};

export default FlashcardList;