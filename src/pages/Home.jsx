import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Layers, Brain, Settings } from 'lucide-react';
import { Button, Card, Typography, Flex } from 'antd';

const { Title, Text } = Typography;

const Home = () => {
  const navigate = useNavigate();

  return (
    <div style={{ padding: '50px 20px', maxWidth: 900, margin: '0 auto' }}>
      <Flex justify="center" align="center" style={{ position: 'relative', marginBottom: 40 }}>
        <Title level={1} style={{ color: 'white', fontFamily: 'Oswald', textTransform: 'uppercase', margin: 0, textShadow: '2px 2px 0 rgba(0,0,0,0.2)' }}>
          Học Cùng Cô Quốc Anh &#128513;
        </Title>
        <Button 
          type="text" 
          icon={<Settings size={20} color="white" />} 
          onClick={() => navigate('/admin')} 
          style={{ position: 'absolute', right: 0 }}
        />
      </Flex>

      <Flex gap="large" justify="center" wrap="wrap">
        {/* Flashcard Option */}
        <Card 
          hoverable
          onClick={() => navigate('/flashcards')}
          style={{ width: 280, textAlign: 'center', border: 'none' }}
        >
          <Flex vertical align="center" gap="middle">
            <Layers size={60} color="#1890ff" />
            <div>
              <Title level={3} style={{ margin: 0, fontFamily: 'Oswald' }}>FLASHCARDS</Title>
              <Text type="secondary">Review vocabulary</Text>
            </div>
          </Flex>
        </Card>

        {/* Quiz Option */}
        <Card 
          hoverable
          onClick={() => navigate('/quizzes')}
          style={{ width: 280, textAlign: 'center', border: 'none' }}
        >
          <Flex vertical align="center" gap="middle">
            <Brain size={60} color="#52c41a" />
            <div>
              <Title level={3} style={{ margin: 0, fontFamily: 'Oswald' }}>QUIZZES</Title>
              <Text type="secondary">Test your knowledge</Text>
            </div>
          </Flex>
        </Card>
      </Flex>
    </div>
  );
};

export default Home;