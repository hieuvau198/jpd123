import React from 'react';
import { useNavigate } from 'react-router-dom';
import { List, Button } from 'antd';
import { Home } from 'lucide-react';
import PracticeCard from '../components/PracticeCard';

const QuizList = ({ quizData }) => {
  const navigate = useNavigate();

  return (
    <div className="app-container">
      <div className="home-header">
        <Button type="text" icon={<Home size={16}/>} onClick={() => navigate('/')}>
           Back Home
        </Button>
        <h2>Quiz Library</h2>
      </div>

      <List
        grid={{ gutter: 16, xs: 1, sm: 2, md: 3, lg: 3 }}
        pagination={{
            position: 'bottom',
            align: 'center',
            pageSize: 9,
        }}
        dataSource={quizData}
        renderItem={(item) => (
          <List.Item>
            <PracticeCard 
              practice={item} 
              onClick={() => navigate(`/quiz/${item.id}`)} 
            />
          </List.Item>
        )}
      />
    </div>
  );
};

export default QuizList;