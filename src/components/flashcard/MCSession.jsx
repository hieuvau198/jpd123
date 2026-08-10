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
    let combinedQuestions = [];
    
    // Generate TWO questions for every word (Bidirectional)
    allQuestions.forEach(q => {
      
      // --- Type 1: Show Question (English), Guess Answer (Vietnamese) ---
      const type1OtherAnswers = allQuestions
        .filter(sq => sq.id !== q.id)
        .map(sq => sq.answer);
      
      const type1WrongAnswers = shuffleArray(type1OtherAnswers).slice(0, 3);
      const type1Options = shuffleArray([q.answer, ...type1WrongAnswers]);
      
      combinedQuestions.push({ 
        ...q, 
        uniqueSessionId: `${q.id || q.question}_type1`, // Unique ID for key tracking
        displayQuestion: q.question, 
        correctAnswer: q.answer, 
        options: type1Options, 
        correctAttemptsNeeded: 1 
      });

      // --- Type 2: Show Answer (Vietnamese), Guess Question (English) ---
      const type2OtherAnswers = allQuestions
        .filter(sq => sq.id !== q.id)
        .map(sq => sq.question);
      
      const type2WrongAnswers = shuffleArray(type2OtherAnswers).slice(0, 3);
      const type2Options = shuffleArray([q.question, ...type2WrongAnswers]);
      
      combinedQuestions.push({ 
        ...q, 
        uniqueSessionId: `${q.id || q.question}_type2`, 
        displayQuestion: q.answer, 
        correctAnswer: q.question, 
        options: type2Options, 
        correctAttemptsNeeded: 1 
      });

    });
    
    // Shuffle the combined list so Type 1 and Type 2 questions are fully mixed
    setQuestions(shuffleArray(combinedQuestions));
    setCurrentIndex(0);
    setWrongIds(new Set());
    setIsFinished(false);
    setSelectedAnswer(null);
  };

  const handleNext = (isCorrect) => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    const currentQ = questions[currentIndex];
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
    const isCorrect = ans === currentQ.correctAnswer;
    
    if (!isCorrect) {
      // Record wrong answer (This records the base ID, so if they fail either direction, the word counts as wrong for scoring)
      setWrongIds(prev => new Set(prev).add(currentQ.id || currentQ.question));
    }

    // 1s delay if correct, 5s delay if wrong
    const delay = isCorrect ? 1000 : 5000;
    
    timerRef.current = setTimeout(() => {
      handleNext(isCorrect);
    }, delay);
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
        practiceId={data.id} 
        practiceType="Flashcard"      
        practiceName={data.title} 
      />
    );
  }

  const currentQ = questions[currentIndex];
  const progressPercent = Math.round((currentIndex / questions.length) * 100);
  
  // Dynamic accurate score based on real progress
  const currentScore = data?.questions?.length ? Math.max(0, Math.round(((data.questions.length - wrongIds.size) / data.questions.length) * 100)) : 0;

  return (
    <div 
      translate="no" 
      className="notranslate" 
      style={{ maxWidth: 800, margin: '0 auto', padding: 20 }}
    >
      {/* Top Header Row */}
      <Flex justify="space-between" align="center" style={{ marginBottom: 20, marginTop: 40 }}>
        <Button icon={<ArrowLeft size={20} />} onClick={onBack} />
        
        <div style={{ flex: 1, maxWidth: 300, margin: '0 20px' }}>
            <Flex vertical align="center">
                <Text strong>{currentIndex + 1} / {questions.length}</Text>
                <Progress percent={progressPercent} showInfo={false} size="small" status="active" />
            </Flex>
        </div>

        <Button type="text" disabled>
            {currentScore}%
        </Button>
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
        <Title level={2}>{currentQ.displayQuestion}</Title>
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
            if (opt === currentQ.correctAnswer) {
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
