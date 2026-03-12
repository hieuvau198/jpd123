import React, { useState, useEffect } from 'react';
import { Card, Button, Typography, Flex } from 'antd';
import { Home, ArrowLeft, ArrowRight, Volume2 } from 'lucide-react';
import SessionResult from '../SessionResult';

const { Title, Text } = Typography;

const shuffleArray = (array) => {
  const newArr = [...array];
  for (let i = newArr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArr[i], newArr[j]] = [newArr[j], newArr[i]];
  }
  return newArr;
};

const ViewSession = ({ data, onHome, onBack }) => {
  const [queue, setQueue] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (data && data.questions) {
      setQueue(shuffleArray([...data.questions]));
    }
  }, [data]);

  const handleSpeech = (text) => {
    if (!text) return;
    if ('speechSynthesis' in window) {
      const synth = window.speechSynthesis;
      if (synth.speaking) synth.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'en-US'; 
      utterance.rate = 0.9; 
      synth.speak(utterance);
    }
  };

  const handleNext = () => {
    setCurrentIndex(prev => prev + 1);
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.code === 'Space') {
        e.preventDefault();
        if (queue[currentIndex]) {
          handleSpeech(queue[currentIndex].question);
        }
      } else if (e.code === 'ArrowRight') {
         handleNext();
      } else if (e.code === 'ArrowLeft') {
         handlePrev();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, queue]);

  if (queue.length === 0) return null;

  // --- COMPLETED SCREEN FOR FLASHCARD VIEW ---
  if (currentIndex >= queue.length) {
    return (
      <SessionResult 
        score={1} // Viewing flashcards is practice, so automatic perfect score
        onBack={onBack} 
        onRestart={() => {
           setQueue(shuffleArray([...data.questions]));
           setCurrentIndex(0);
        }} 
      />
    );
  }

  const currentCard = queue[currentIndex];

  return (
    <div style={{ maxWidth: 600, margin: '0 auto', padding: '40px 20px', marginTop: 16 }}>
      <Flex justify="space-between" align="center" style={{ marginBottom: 20 }}>
        <Button icon={<ArrowLeft size={16}/>} onClick={onBack} ></Button>
        <Text strong>{currentIndex + 1} / {queue.length}</Text>
      </Flex>

      <Card 
        hoverable
        onClick={() => handleSpeech(currentCard.question)}
        style={{ 
          minHeight: 350, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          marginBottom: 30,
          cursor: 'pointer',
          textAlign: 'center'
        }}
      >
        <Flex vertical align="center" gap="large">
          <Flex align="center" gap="small">
            <Title level={2} style={{ color: '#1890ff', margin: 0 }}>
              {currentCard.question}
            </Title>
            <Volume2 size={24} style={{ color: '#1890ff' }} />
          </Flex>
          
          <Title level={4} type="secondary">
            {currentCard.answer}
          </Title>
          
          <Text type="secondary" style={{ marginTop: 20, fontSize: 12 }}>
            Click or Space to Listen
          </Text>
        </Flex>
      </Card>

      <Flex justify="center" gap="middle">
        <Button size="large" icon={<ArrowLeft size={16} />} onClick={(e) => {e.stopPropagation(); handlePrev()}} disabled={currentIndex === 0}>Prev</Button>
        <Button size="large" icon={<Volume2 size={16} />} onClick={(e) => {e.stopPropagation(); handleSpeech(currentCard.question);}}>Listen</Button>
        <Button size="large" icon={<ArrowRight size={16} />} iconPosition='end' onClick={(e) => {e.stopPropagation(); handleNext()}}>Next</Button>
      </Flex>
    </div>
  );
};

export default ViewSession;