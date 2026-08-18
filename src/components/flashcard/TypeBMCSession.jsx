// src/components/flashcard/TypeBMCSession.jsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Card, Typography } from 'antd';
import SessionResult from '../SessionResult';
import TypeBHeader from './typeB/TypeBHeader';
import TypeBCard from './typeB/TypeBCard';
import TypeBSettingsModal from './typeB/TypeBSettingsModal';
import { generateTypeBQuestions } from './typeB/typeBGenerator';

const { Text } = Typography;

const TypeBMCSession = ({ data, onHome, onBack }) => {
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [wrongIds, setWrongIds] = useState(new Set());
  const [totalUniqueQuestions, setTotalUniqueQuestions] = useState(0);

  // Audio Settings State
  const [showSettings, setShowSettings] = useState(false);
  const [autoSpeakQuestion, setAutoSpeakQuestion] = useState(localStorage.getItem('autoSpeakQuestion') !== 'false');
  const [autoSpeakAnswer, setAutoSpeakAnswer] = useState(localStorage.getItem('autoSpeakAnswer') !== 'false');
  const timerRef = useRef(null);

  const speakText = useCallback((text, lang = 'en-US') => {
    if (!text || typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = lang;
      utterance.rate = 0.9;
      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.warn("Speech error:", e);
    }
  }, []);

  const initGame = useCallback(() => {
    if (!data?.questions) return;
    const combined = generateTypeBQuestions(data.questions);
    setQuestions(combined);
    setTotalUniqueQuestions(combined.length);
    setCurrentIndex(0);
    setWrongIds(new Set());
    setIsFinished(false);
    setSelectedAnswer(null);
  }, [data]);

  useEffect(() => {
    initGame();
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, [initGame]);

  useEffect(() => {
    if (questions.length > 0 && !isFinished && autoSpeakQuestion) {
      const currentQ = questions[currentIndex];
      if (currentQ) {
        speakText(currentQ.displayQuestion, currentQ.qLang || 'en-US');
      }
    }
  }, [currentIndex, questions, isFinished, autoSpeakQuestion, speakText]);

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
      setQuestions((prev) => {
        const newQueue = [...prev];
        const insertPos = Math.min(currentIndex + 3, newQueue.length);
        newQueue.splice(insertPos, 0, updatedQ);
        return newQueue;
      });
    }

    const newLength = questions.length + (needsRequeue ? 1 : 0);
    if (currentIndex + 1 < newLength) {
      setCurrentIndex((prev) => prev + 1);
      setSelectedAnswer(null);
    } else {
      setIsFinished(true);
    }
  };

  const handleAnswerClick = (ans) => {
    if (selectedAnswer !== null) return;
    setSelectedAnswer(ans);
    const currentQ = questions[currentIndex];
    const isCorrect = ans === currentQ.correctAnswer;
    if (!isCorrect) {
      setWrongIds((prev) => new Set(prev).add(currentQ.id));
    }
    if (autoSpeakAnswer) {
      speakText(currentQ.correctAnswer, currentQ.aLang || 'vi-VN');
    }
    const delay = isCorrect ? 1000 : 5000;
    timerRef.current = setTimeout(() => {
      handleNext(isCorrect);
    }, delay);
  };

  if (questions.length === 0) return null;

  if (isFinished) {
    const finalScore = Math.max(0, Math.round(((totalUniqueQuestions - wrongIds.size) / totalUniqueQuestions) * 100));
    return (
      <SessionResult
        score={finalScore}
        resultMessage={`"${data?.title || 'current'}": MC Type B - ${totalUniqueQuestions} questions!`}
        onBack={onBack}
        onRestart={initGame}
        practiceId={data.id}
        practiceType="Flashcard"
        practiceName={data.title}
      />
    );
  }

  const currentQ = questions[currentIndex];
  const currentScore = totalUniqueQuestions > 0
    ? Math.max(0, Math.round(((totalUniqueQuestions - wrongIds.size) / totalUniqueQuestions) * 100))
    : 0;

  return (
    <div translate="no" className="notranslate" style={{ maxWidth: 800, margin: '0 auto', padding: 20 }}>
      <TypeBSettingsModal
        showSettings={showSettings}
        setShowSettings={setShowSettings}
        autoSpeakQuestion={autoSpeakQuestion}
        setAutoSpeakQuestion={setAutoSpeakQuestion}
        autoSpeakAnswer={autoSpeakAnswer}
        setAutoSpeakAnswer={setAutoSpeakAnswer}
      />
      <TypeBHeader
        onBack={onBack}
        phase={currentQ.phase}
        currentIndex={currentIndex}
        totalQuestions={questions.length}
        currentScore={currentScore}
        onOpenSettings={() => setShowSettings(true)}
      />
      <TypeBCard question={currentQ} onSpeak={speakText} />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '20px' }}>
        {currentQ.options.map((opt, idx) => {
          let bgColor = '#fff', borderColor = '#d9d9d9', textColor = '#333';
          if (selectedAnswer !== null) {
            if (opt === currentQ.correctAnswer) {
              bgColor = '#f6ffed'; borderColor = '#b7eb8f'; textColor = '#52c41a';
            } else if (opt === selectedAnswer) {
              bgColor = '#fff2f0'; borderColor = '#ffccc7'; textColor = '#f5222d';
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
              <Text strong style={{ fontSize: '1.1rem', color: textColor }}>
                {opt}
              </Text>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default TypeBMCSession;