import React, { useState, useEffect, useRef } from 'react';
import { Card, Button, Typography, Flex, Progress } from 'antd';
import { ArrowLeft, Settings, Lightbulb } from 'lucide-react';
import MCOptionsGrid from './MCOptionsGrid';

const { Title, Text } = Typography;
const shuffleArray = (array) => [...array].sort(() => 0.5 - Math.random());

const StandardMCPhase = ({ 
  data, onComplete, onBack, speakText, 
  setShowSettings, autoSpeakQuestion, autoSpeakAnswer 
}) => {
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [wrongIds, setWrongIds] = useState(new Set());
  const [showHint, setShowHint] = useState(false);
  const timerRef = useRef(null);

  useEffect(() => { setShowHint(false); }, [currentIndex]);

  useEffect(() => {
    if (data && data.questions) {
      const allQuestions = data.questions;
      let combinedQuestions = [];
      
      allQuestions.forEach(q => {
        const type1Wrong = shuffleArray(allQuestions.filter(sq => sq.id !== q.id).map(sq => sq.answer)).slice(0, 3);
        combinedQuestions.push({
          ...q,
          uniqueSessionId: `${q.id || q.question}_type1`,
          displayQuestion: q.question,
          correctAnswer: q.answer,
          options: shuffleArray([q.answer, ...type1Wrong]),
          correctAttemptsNeeded: 1
        });
        
        const type2Wrong = shuffleArray(allQuestions.filter(sq => sq.id !== q.id).map(sq => sq.question)).slice(0, 3);
        combinedQuestions.push({
          ...q,
          uniqueSessionId: `${q.id || q.question}_type2`,
          displayQuestion: q.answer,
          correctAnswer: q.question,
          options: shuffleArray([q.question, ...type2Wrong]),
          correctAttemptsNeeded: 1
        });
      });
      
      setQuestions(shuffleArray(combinedQuestions));
      setCurrentIndex(0);
      setWrongIds(new Set());
      setSelectedAnswer(null);
    }
    
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [data]);

  useEffect(() => {
    if (questions.length > 0 && autoSpeakQuestion) {
      const currentQ = questions[currentIndex];
      const lang = currentQ.uniqueSessionId.includes('type1') ? 'en-US' : 'vi-VN';
      speakText(currentQ.displayQuestion, lang);
    }
  }, [currentIndex, questions, autoSpeakQuestion, speakText]);

  const handleNext = (isCorrect) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    
    const currentQ = questions[currentIndex];
    let updatedQ = { ...currentQ };
    let needsRequeue = false;

    if (!isCorrect) {
      updatedQ.correctAttemptsNeeded = 2;
      needsRequeue = true;
    } else {
      updatedQ.correctAttemptsNeeded = (updatedQ.correctAttemptsNeeded || 1) - 1;
      if (updatedQ.correctAttemptsNeeded > 0) needsRequeue = true;
    }

    if (needsRequeue) {
      setQuestions(prev => {
        const newQueue = [...prev];
        newQueue.splice(Math.min(currentIndex + 3, newQueue.length), 0, updatedQ);
        return newQueue;
      });
    }

    const newLength = questions.length + (needsRequeue ? 1 : 0);
    if (currentIndex + 1 < newLength) {
      setCurrentIndex(prev => prev + 1);
      setSelectedAnswer(null);
    } else {
      onComplete(wrongIds);
    }
  };

  const handleAnswerClick = (ans) => {
    if (selectedAnswer !== null) return;
    setSelectedAnswer(ans);
    
    const currentQ = questions[currentIndex];
    const isCorrect = ans === currentQ.correctAnswer;
    
    if (!isCorrect) {
      setWrongIds(prev => new Set(prev).add(currentQ.id || currentQ.question));
    }
    
    if (autoSpeakAnswer) {
      const ansLang = currentQ.uniqueSessionId.includes('type1') ? 'vi-VN' : 'en-US';
      speakText(currentQ.correctAnswer, ansLang);
    }
    
    timerRef.current = setTimeout(() => handleNext(isCorrect), isCorrect ? 1000 : 5000);
  };

  if (questions.length === 0) return null;

  const currentQ = questions[currentIndex];
  const progressPercent = Math.round((currentIndex / questions.length) * 100);
  const currentScore = data?.questions?.length ? Math.max(0, Math.round(((data.questions.length - wrongIds.size) / data.questions.length) * 100)) : 0;

  return (
    <div translate="no" className="notranslate" style={{ maxWidth: 800, margin: '0 auto', padding: 20 }}>
      <Flex justify="space-between" align="center" style={{ marginBottom: 20, marginTop: 40 }}>
        <Button icon={<ArrowLeft size={20} />} onClick={() => { window.speechSynthesis.cancel(); onBack(); }} />
        <div style={{ flex: 1, maxWidth: 300, margin: '0 20px' }}>
          <Flex vertical align="center">
            <Text strong>Phase 1: {currentIndex + 1} / {questions.length}</Text>
            <Progress percent={progressPercent} showInfo={false} size="small" status="active" />
          </Flex>
        </div>
        <Flex gap="small">
          <Button type="text" disabled>{currentScore}%</Button>
          <Button icon={<Settings size={18} />} onClick={() => setShowSettings(true)} title="Voice Settings" />
        </Flex>
      </Flex>
      <Card style={{ textAlign: 'center', marginBottom: 30, padding: '40px 20px', borderRadius: 16, boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
        <Title level={2}>{currentQ.displayQuestion}</Title>
        <Flex justify="center" gap="small" style={{ marginTop: 10 }}>
          <Button type="dashed" onClick={() => speakText(currentQ.displayQuestion, currentQ.uniqueSessionId.includes('type1') ? 'en-US' : 'vi-VN')}>Read Aloud</Button>
          {currentQ.hint && <Button type="dashed" icon={<Lightbulb size={16} />} onClick={() => setShowHint(!showHint)}>Hint</Button>}
        </Flex>
        {showHint && currentQ.hint && (
          <div style={{ marginTop: 16, padding: '12px', background: '#fffbe6', border: '1px solid #ffe58f', borderRadius: 8 }}>
            <Text style={{ color: '#d48806', fontSize: '1rem' }}>{currentQ.hint}</Text>
          </div>
        )}
      </Card>
      
      <MCOptionsGrid options={currentQ.options} selectedAnswer={selectedAnswer} correctAnswer={currentQ.correctAnswer} handleAnswerClick={handleAnswerClick} />
    </div>
  );
};

export default StandardMCPhase;