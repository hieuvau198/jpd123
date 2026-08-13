// src/components/flashcard/MCSession.jsx
import React, { useState, useEffect, useRef } from 'react';
import { Card, Button, Typography, Flex, Progress } from 'antd';
import { ArrowLeft } from 'lucide-react';
import SessionResult from '../SessionResult';
import TypeBMCSession from './TypeBMCSession';

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
  // Check if dataset is type-b
  const isTypeB = data?.type === 'flashcard-b' || data?.questions?.[0]?.type === 'type-b';

  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  
  // Track unique IDs of questions the user got wrong for scoring
  const [wrongIds, setWrongIds] = useState(new Set());
  
  const timerRef = useRef(null);

  useEffect(() => {
    if (data && data.questions && !isTypeB) {
      initGame();
    }
    // Cleanup timer and speech on unmount
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      window.speechSynthesis.cancel(); // Stop reading if the user leaves the page
    };
  }, [data, isTypeB]);

  // --- NEW FEATURE: Auto Read Out Loud ---
  useEffect(() => {
    if (questions.length > 0 && !isFinished) {
      const currentQ = questions[currentIndex];
      
      // Cancel any currently playing speech to avoid overlap
      window.speechSynthesis.cancel();
      
      const utterance = new SpeechSynthesisUtterance(currentQ.displayQuestion);
      
      // Smart language detection based on our type mapping
      if (currentQ.uniqueSessionId.includes('type1')) {
        utterance.lang = 'en-US'; // Read in English
      } else {
        utterance.lang = 'vi-VN'; // Read in Vietnamese
      }
      
      window.speechSynthesis.speak(utterance);
    }
  }, [currentIndex, questions, isFinished]);
  // ----------------------------------------

  if (isTypeB) {
    return <TypeBMCSession data={data} onHome={onHome} onBack={onBack} />;
  }

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
        uniqueSessionId: `${q.id || q.question}_type1`,
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
    
    // Shuffle the combined list
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
       updatedQ.correctAttemptsNeeded = 2;
       needsRequeue = true;
    } else {
       updatedQ.correctAttemptsNeeded = (updatedQ.correctAttemptsNeeded || 1) - 1;
       if (updatedQ.correctAttemptsNeeded > 0) {
           needsRequeue = true;
       }
    }

    if (needsRequeue) {
       setQuestions(prev => {
          const newQueue = [...prev];
          const insertPos = Math.min(currentIndex + 3, newQueue.length);
          newQueue.splice(insertPos, 0, updatedQ);
          return newQueue;
       });
    }

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
      setWrongIds(prev => new Set(prev).add(currentQ.id || currentQ.question));
    }

    // --- SPEAK CORRECT ANSWER ---
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(currentQ.correctAnswer);
    // Type 1: display is en-US, answer is vi-VN. Type 2: display is vi-VN, answer is en-US
    utterance.lang = currentQ.uniqueSessionId.includes('type1') ? 'vi-VN' : 'en-US';
    window.speechSynthesis.speak(utterance);
    // ----------------------------

    // 2s delay if correct, 5s delay if wrong
    const delay = isCorrect ? 2000 : 5000;
    
    timerRef.current = setTimeout(() => {
      handleNext(isCorrect);
    }, delay);
  };

  if (questions.length === 0) return null;

  if (isFinished) {
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
  const currentScore = data?.questions?.length ? Math.max(0, Math.round(((data.questions.length - wrongIds.size) / data.questions.length) * 100)) : 0;

  return (
    <div 
      translate="no" 
      className="notranslate" 
      style={{ maxWidth: 800, margin: '0 auto', padding: 20 }}
    >
      <Flex justify="space-between" align="center" style={{ marginBottom: 20, marginTop: 40 }}>
        <Button icon={<ArrowLeft size={20} />} onClick={() => {
            window.speechSynthesis.cancel();
            onBack();
        }} />
        
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
        
        <Button 
          type="dashed" 
          onClick={() => {
            window.speechSynthesis.cancel();
            const utterance = new SpeechSynthesisUtterance(currentQ.displayQuestion);
            utterance.lang = currentQ.uniqueSessionId.includes('type1') ? 'en-US' : 'vi-VN';
            window.speechSynthesis.speak(utterance);
          }}
          style={{ marginTop: 10 }}
        >
          Read Aloud 
        </Button>
      </Card>

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