// src/components/flashcard/TypeBMCSession.jsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Card, Typography, Checkbox, Button, Flex } from 'antd';
import { Layers } from 'lucide-react';
import SessionResult from '../SessionResult';
import TypeBHeader from './typeB/TypeBHeader';
import TypeBCard from './typeB/TypeBCard';
import TypeBSettingsModal from './typeB/TypeBSettingsModal';
import { generateTypeBQuestions, shuffleArray } from './typeB/typeBGenerator';

const { Title, Text } = Typography;

const TypeBMCSession = ({ data, onHome, onBack }) => {
  const [selectedTypes, setSelectedTypes] = useState({
    words: true,
    phrases: false,
    sentences: false,
  });
  const [isConfigured, setIsConfigured] = useState(false);

  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [wrongIds, setWrongIds] = useState(new Set());
  const [totalUniqueQuestions, setTotalUniqueQuestions] = useState(0);

  // Audio Settings State
  const [showSettings, setShowSettings] = useState(false);
  const [autoSpeakQuestion, setAutoSpeakQuestion] = useState(
    localStorage.getItem('autoSpeakQuestion') !== 'false'
  );
  const [autoSpeakAnswer, setAutoSpeakAnswer] = useState(
    localStorage.getItem('autoSpeakAnswer') !== 'false'
  );

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

  const handleStartSession = (typesToUse = selectedTypes) => {
    if (!data?.questions) return;
    const combined = generateTypeBQuestions(data.questions, typesToUse);
    setQuestions(combined);
    setTotalUniqueQuestions(combined.length);
    setCurrentIndex(0);
    setWrongIds(new Set());
    setIsFinished(false);
    setSelectedAnswer(null);
    setIsConfigured(true);
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  useEffect(() => {
    if (isConfigured && questions.length > 0 && !isFinished && autoSpeakQuestion) {
      const currentQ = questions[currentIndex];
      if (currentQ) {
        speakText(currentQ.displayQuestion, currentQ.qLang || 'en-US');
      }
    }
  }, [currentIndex, questions, isFinished, autoSpeakQuestion, isConfigured, speakText]);

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
      updatedQ.options = shuffleArray(updatedQ.options);
      needsRequeue = true;
    } else {
      updatedQ.correctAttemptsNeeded = (updatedQ.correctAttemptsNeeded || 1) - 1;
      if (updatedQ.correctAttemptsNeeded > 0) {
        updatedQ.options = shuffleArray(updatedQ.options);
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

  // --- Entry Screen: Content Selector ---
  if (!isConfigured) {
    const isAnySelected = selectedTypes.words || selectedTypes.phrases || selectedTypes.sentences;
    return (
      <div className="max-w-md mx-auto my-14 px-4">
        <Card className="rounded-3xl shadow-2xl border-0 bg-slate-900/90 text-white backdrop-blur-xl text-center p-6 border border-white/10">
          <Layers size={44} className="mx-auto text-cyan-400 mb-6" />
          <Title level={3} style={{ color: '#fff', marginBottom: 20 }}>
            Lựa chọn nội dung luyện tập
          </Title>
          <Flex vertical gap="middle" className="text-left max-w-xs mx-auto mb-8">
            <Checkbox
              checked={selectedTypes.words}
              onChange={(e) => setSelectedTypes({ ...selectedTypes, words: e.target.checked })}
              className="text-base font-medium text-slate-200"
            >
              Từ vựng chính (Words)
            </Checkbox>
            <Checkbox
              checked={selectedTypes.phrases}
              onChange={(e) => setSelectedTypes({ ...selectedTypes, phrases: e.target.checked })}
              className="text-base font-medium text-slate-200"
            >
              Cụm liên quan (Phrases)
            </Checkbox>
            <Checkbox
              checked={selectedTypes.sentences}
              onChange={(e) => setSelectedTypes({ ...selectedTypes, sentences: e.target.checked })}
              className="text-base font-medium text-slate-200"
            >
              Câu hoàn chỉnh (Sentences)
            </Checkbox>
          </Flex>
          <Flex justify="center" gap="middle">
            <Button size="large" onClick={onBack} className="rounded-xl px-6 bg-white/10 text-white border-0 hover:bg-white/20">
              Quay lại
            </Button>
            <Button
              type="primary"
              size="large"
              disabled={!isAnySelected}
              onClick={() => handleStartSession(selectedTypes)}
              className="rounded-xl px-8 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold border-0"
            >
              Bắt đầu
            </Button>
          </Flex>
        </Card>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="text-center py-20">
        <Title level={4} className="text-white">Không tìm thấy câu hỏi phù hợp với lựa chọn!</Title>
        <Button onClick={() => setIsConfigured(false)} className="mt-4 rounded-xl">
          Chọn lại
        </Button>
      </div>
    );
  }

  if (isFinished) {
    const finalScore = Math.max(0, Math.round(((totalUniqueQuestions - wrongIds.size) / totalUniqueQuestions) * 100));
    return (
      <SessionResult
        score={finalScore}
        resultMessage={`"${data?.title || 'current'}": MC Type B - ${totalUniqueQuestions} questions!`}
        onBack={onBack}
        onRestart={() => setIsConfigured(false)}
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
        onBack={() => setIsConfigured(false)}
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