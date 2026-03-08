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
  const [isFinished, setIsFinished] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  
  // Track unique IDs of questions the user got wrong for scoring
  const [wrongIds, setWrongIds] = useState(new Set());
  
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
      
      return { ...q, options, correctAttemptsNeeded: 1 };
    });
    
    setQuestions(mcQuestions);
    setCurrentIndex(0);
    setWrongIds(new Set());
    setIsFinished(false);
    setSelectedAnswer(null);
  };

  const handleNext = (isCorrectParam) => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    const currentQ = questions[currentIndex];
    const isCorrect = typeof isCorrectParam === 'boolean' ? isCorrectParam : selectedAnswer === currentQ.answer;

    let updatedQ = { ...currentQ };
    let needsRequeue = false;

    if (!isCorrect) {
       // Failed, reset attempts to 2 so they have to get it right twice
       updatedQ.correctAttemptsNeeded = 2;
       needsRequeue = true;
    } else {
       // Decrement attempts needed
       updatedQ.correctAttemptsNeeded = (updatedQ.correctAttemptsNeeded || 1) - 1;
       if (updatedQ.correctAttemptsNeeded > 0) {
           needsRequeue = true;
       }
    }

    if (needsRequeue) {
       setQuestions(prev => {
          const newQueue = [...prev];
          // Re-insert exactly after 2 questions (index + 3)
          const insertPos = Math.min(currentIndex + 3, newQueue.length);
          newQueue.splice(insertPos, 0, updatedQ);
          return newQueue;
       });
    }

    // Determine if we are at the end
    const newLength = questions.length + (needsRequeue ? 1 : 0);
    if (currentIndex + 1 < newLength) {
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
      // Auto-advance if correct
      timerRef.current = setTimeout(() => {
        handleNext(true);
      }, 1000);
    } else {
      // Record wrong answer
      setWrongIds(prev => new Set(prev).add(currentQ.id || currentQ.question));
    }
  };

  if (questions.length === 0) return null;

  if (isFinished) {
    // Calculate percentage score based strictly on original unique questions length
    const totalUniqueQuestions = data.questions.length;
    const finalScore = Math.max(0, Math.round(((totalUniqueQuestions - wrongIds.size) / totalUniqueQuestions) * 100));
    return (
      <SessionResult 
        score={finalScore}
        resultMessage={`"${data?.title || 'current'}": MC ${totalUniqueQuestions} words!`}
        onBack={onBack}
        onRestart={initGame}
        practiceId={data.id} // Pass the flashcard ID
        practiceType="Flashcard"      // Tell it this is a flashcard
      />
    );
  }

  const currentQ = questions[currentIndex];
  const progressPercent = Math.round((currentIndex / questions.length) * 100);
  
  // Dynamic accurate score based on real progress
  const currentScore = data?.questions?.length ? Math.max(0, Math.round(((data.questions.length - wrongIds.size) / data.questions.length) * 100)) : 0;

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: 20 }}>
      {/* Top Header Row */}
      <Flex justify="space-between" align="center" style={{ marginBottom: 20, marginTop: 30 }}>
        <Button icon={<ArrowLeft size={20} />} onClick={onBack} />
        
        <div style={{ flex: 1, maxWidth: 300, margin: '0 20px' }}>
            <Flex vertical align="center">
                <Text strong>Question {currentIndex + 1} / {questions.length}</Text>
                <Progress percent={progressPercent} showInfo={false} size="small" status="active" />
            </Flex>
        </div>

        <Button type="text" disabled>
            Score: {currentScore}%
        </Button>
      </Flex>

      {/* Next Button Container */}
      <Flex justify="center" align="center" style={{ minHeight: 50, marginBottom: 20 }}>
        {selectedAnswer !== null && selectedAnswer !== currentQ.answer && (
          <Button type="primary" danger size="large" onClick={() => handleNext(false)}>
            Next Question
          </Button>
        )}
        {selectedAnswer !== null && selectedAnswer === currentQ.answer && (
          <Button type="primary" style={{ backgroundColor: '#52c41a' }} size="large" onClick={() => handleNext(true)}>
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

      {/* 2x2 Grid Layout for Options */}
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
              bgColor = '#f6ffed';
              borderColor = '#b7eb8f';
              textColor = '#52c41a';
            } else if (opt === selectedAnswer) {
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
                height: '100%',
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