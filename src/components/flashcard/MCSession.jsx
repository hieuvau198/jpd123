import React, { useState, useEffect, useRef } from 'react';
import { Card, Button, Typography, Flex, Progress } from 'antd';
import { ArrowLeft } from 'lucide-react';
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

const MCSession = ({ data, onHome, onBack }) => {
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  
  const timerRef = useRef(null);

  useEffect(() => {
    if (data && data.questions) {
      initGame();
    }
    // Cleanup timer on unmount
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [data]);

  const initGame = () => {
    const allQuestions = data.questions;
    
    // Generate the multiple choice questions
    const mcQuestions = shuffleArray([...allQuestions]).map(q => {
      const correctAnswer = q.answer;
      // Get all other answers from the set
      const otherAnswers = allQuestions
        .filter(sq => sq.id !== q.id)
        .map(sq => sq.answer);
      
      // Randomly pick up to 3 wrong answers
      const wrongAnswers = shuffleArray(otherAnswers).slice(0, 3);
      
      // Combine and shuffle the options so the correct answer isn't always first
      const options = shuffleArray([correctAnswer, ...wrongAnswers]);
      
      return { ...q, options };
    });
    
    setQuestions(mcQuestions);
    setCurrentIndex(0);
    setScore(0);
    setIsFinished(false);
    setSelectedAnswer(null);
  };

  const handleNext = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    
    if (currentIndex + 1 < questions.length) {
      setCurrentIndex(prev => prev + 1);
      setSelectedAnswer(null);
    } else {
      setIsFinished(true);
    }
  };

  const handleAnswerClick = (ans) => {
    if (selectedAnswer !== null) return; // Prevent clicking multiple times
    
    setSelectedAnswer(ans);
    const currentQ = questions[currentIndex];
    
    if (ans === currentQ.answer) {
      setScore(prev => prev + 1);
      // Auto-advance if correct
      timerRef.current = setTimeout(() => {
        handleNext();
      }, 1000);
    } 
    // If wrong, we do nothing here. The user must click the "Next" button.
  };

  if (questions.length === 0) return null;

  if (isFinished) {
    // Calculate percentage score
    const finalScore = Math.round((score / questions.length) * 100);
    return (
      <SessionResult 
        score={finalScore}
        resultMessage={`"${data?.title || 'current'}": MC ${questions.length} words!`}
        onBack={onBack}
        onRestart={initGame}
      />
    );
  }

  const currentQ = questions[currentIndex];
  const progressPercent = Math.round((currentIndex / questions.length) * 100);

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: 20 }}>
      {/* Top Header Row */}
      <Flex justify="space-between" align="center" style={{ marginBottom: 20 }}>
        <Button icon={<ArrowLeft size={16} />} onClick={onBack}>Back</Button>
        
        <div style={{ flex: 1, maxWidth: 300, margin: '0 20px' }}>
            <Flex vertical align="center">
                <Text strong>Question {currentIndex + 1} / {questions.length}</Text>
                <Progress percent={progressPercent} showInfo={false} size="small" status="active" />
            </Flex>
        </div>

        <Button type="text" disabled>
            Score: {score}
        </Button>
      </Flex>

      {/* Next Button Container (Placed at the top, below the progress bar) */}
      <Flex justify="center" align="center" style={{ minHeight: 50, marginBottom: 20 }}>
        {selectedAnswer !== null && selectedAnswer !== currentQ.answer && (
          <Button type="primary" danger size="large" onClick={handleNext}>
            Next Question
          </Button>
        )}
        {selectedAnswer !== null && selectedAnswer === currentQ.answer && (
          <Button type="primary" style={{ backgroundColor: '#52c41a' }} size="large" onClick={handleNext}>
            Correct! Next Question
          </Button>
        )}
      </Flex>

      {/* Question Card */}
      <Card 
        style={{ 
          textAlign: 'center', 
          marginBottom: 30, 
          padding: '40px 20px', 
          borderRadius: 16, 
          boxShadow: '0 4px 12px rgba(0,0,0,0.05)' 
        }}
      >
        <Title level={2}>{currentQ.question}</Title>
      </Card>

      {/* 2x2 Grid Layout for Options (4 corners) */}
      <div 
        style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(2, 1fr)', 
          gap: '20px' 
        }}
      >
        {currentQ.options.map((opt, idx) => {
          let bgColor = '#fff';
          let borderColor = '#d9d9d9';
          let textColor = '#333';

          if (selectedAnswer !== null) {
            if (opt === currentQ.answer) {
              // Always show correct answer in green after a choice is made
              bgColor = '#f6ffed';
              borderColor = '#b7eb8f';
              textColor = '#52c41a';
            } else if (opt === selectedAnswer) {
              // Highlight the wrong selected answer in red
              bgColor = '#fff2f0';
              borderColor = '#ffccc7';
              textColor = '#f5222d';
            }
          }

          return (
            <Card 
              key={idx}
              hoverable={selectedAnswer === null}
              onClick={() => handleAnswerClick(opt)}
              style={{ 
                cursor: selectedAnswer === null ? 'pointer' : 'default',
                backgroundColor: bgColor,
                borderColor: borderColor,
                transition: 'all 0.3s ease',
                borderRadius: 12,
                height: '100%', // Ensure all cards stretch equally in the grid
                minHeight: '120px'
              }}
              bodyStyle={{ 
                padding: '20px', 
                height: '100%', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                textAlign: 'center'
              }}
            >
              <Text strong style={{ fontSize: '1.1rem', color: textColor }}>{opt}</Text>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default MCSession;