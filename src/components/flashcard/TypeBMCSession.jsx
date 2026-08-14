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

  // Voice Settings State
  const [voices, setVoices] = useState([]);
  const [showSettings, setShowSettings] = useState(false);
  const [enVoiceURI, setEnVoiceURI] = useState(localStorage.getItem('enVoiceURI') || '');
  const [viVoiceURI, setViVoiceURI] = useState(localStorage.getItem('viVoiceURI') || '');
  const [autoSpeakQuestion, setAutoSpeakQuestion] = useState(localStorage.getItem('autoSpeakQuestion') !== 'false');
  const [autoSpeakAnswer, setAutoSpeakAnswer] = useState(localStorage.getItem('autoSpeakAnswer') !== 'false');

  const timerRef = useRef(null);

  // Load Voices
  useEffect(() => {
    const loadVoices = () => {
      const available = window.speechSynthesis.getVoices();
      setVoices(available);
    };
    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;
  }, []);

  // Hàm phát âm theo giọng đã cài đặt
  const speakText = useCallback((text, lang) => {
    if (!text || !('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang;
    utterance.rate = 0.9;

    const isEn = lang.includes('en');
    const targetURI = isEn ? enVoiceURI : viVoiceURI;

    if (targetURI && voices.length > 0) {
      const selectedVoice = voices.find(v => v.voiceURI === targetURI);
      if (selectedVoice) utterance.voice = selectedVoice;
    } else if (voices.length > 0) {
      const matchedVoice = voices.find(v => v.lang.toLowerCase().includes(lang.split('-')[0].toLowerCase()));
      if (matchedVoice) utterance.voice = matchedVoice;
    }

    window.speechSynthesis.speak(utterance);
  }, [enVoiceURI, viVoiceURI, voices]);

  // Khởi tạo câu hỏi
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
      if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    };
  }, [initGame]);

  // Tự động phát âm câu hỏi
  useEffect(() => {
    if (questions.length > 0 && !isFinished && autoSpeakQuestion) {
      const currentQ = questions[currentIndex];
      speakText(currentQ.displayQuestion, currentQ.qLang || 'en-US');
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
      {/* Settings Modal */}
      <TypeBSettingsModal
        showSettings={showSettings}
        setShowSettings={setShowSettings}
        voices={voices}
        enVoiceURI={enVoiceURI}
        setEnVoiceURI={setEnVoiceURI}
        viVoiceURI={viVoiceURI}
        setViVoiceURI={setViVoiceURI}
        autoSpeakQuestion={autoSpeakQuestion}
        setAutoSpeakQuestion={setAutoSpeakQuestion}
        autoSpeakAnswer={autoSpeakAnswer}
        setAutoSpeakAnswer={setAutoSpeakAnswer}
      />

      {/* Header */}
      <TypeBHeader
        onBack={onBack}
        phase={currentQ.phase}
        currentIndex={currentIndex}
        totalQuestions={questions.length}
        currentScore={currentScore}
        onOpenSettings={() => setShowSettings(true)}
      />

      {/* Question Card */}
      <TypeBCard question={currentQ} onSpeak={speakText} />

      {/* Options Grid */}
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