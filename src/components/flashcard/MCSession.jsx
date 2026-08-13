// src/components/flashcard/MCSession.jsx
import React, { useState, useEffect, useRef } from 'react';
import { Card, Button, Typography, Flex, Progress, Modal, Select, Switch } from 'antd';
import { ArrowLeft, Settings, Lightbulb } from 'lucide-react';
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
  const isTypeB = data?.type === 'flashcard-b' || data?.questions?.[0]?.type === 'type-b';

  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [wrongIds, setWrongIds] = useState(new Set());
  const [showHint, setShowHint] = useState(false);
  
  // --- VOICE SETTINGS STATE ---
  const [voices, setVoices] = useState([]);
  const [showSettings, setShowSettings] = useState(false);
  const [enVoiceURI, setEnVoiceURI] = useState(localStorage.getItem('enVoiceURI') || '');
  const [viVoiceURI, setViVoiceURI] = useState(localStorage.getItem('viVoiceURI') || '');
  
  // Auto-speak toggles (default is true unless saved as 'false' in localStorage)
  const [autoSpeakQuestion, setAutoSpeakQuestion] = useState(localStorage.getItem('autoSpeakQuestion') !== 'false');
  const [autoSpeakAnswer, setAutoSpeakAnswer] = useState(localStorage.getItem('autoSpeakAnswer') !== 'false');

  const timerRef = useRef(null);

  // Reset hint when question changes
  useEffect(() => {
    setShowHint(false);
  }, [currentIndex]);

  // --- LOAD VOICES ---
  useEffect(() => {
    const loadVoices = () => {
      const availableVoices = window.speechSynthesis.getVoices();
      setVoices(availableVoices);
    };
    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;
  }, []);

  // --- ROBUST SPEAK FUNCTION ---
  const speakText = (text, lang) => {
    if (!text) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang;

    const isEn = lang.includes('en');
    const targetURI = isEn ? localStorage.getItem('enVoiceURI') : localStorage.getItem('viVoiceURI');

    if (targetURI && voices.length > 0) {
      const selectedVoice = voices.find(v => v.voiceURI === targetURI);
      if (selectedVoice) utterance.voice = selectedVoice;
    } else if (voices.length > 0) {
      const matchedVoice = voices.find(v => v.lang.includes(lang.split('-')[0]));
      if (matchedVoice) utterance.voice = matchedVoice;
    }

    window.speechSynthesis.speak(utterance);
  };

  useEffect(() => {
    if (data && data.questions && !isTypeB) {
      initGame();
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      window.speechSynthesis.cancel();
    };
  }, [data, isTypeB]);

  // Auto Read Out Loud
  useEffect(() => {
    if (questions.length > 0 && !isFinished && autoSpeakQuestion) {
      const currentQ = questions[currentIndex];
      const lang = currentQ.uniqueSessionId.includes('type1') ? 'en-US' : 'vi-VN';
      speakText(currentQ.displayQuestion, lang);
    }
  }, [currentIndex, questions, isFinished, voices, autoSpeakQuestion]);

  if (isTypeB) {
    return <TypeBMCSession data={data} onHome={onHome} onBack={onBack} />;
  }

  const initGame = () => {
    const allQuestions = data.questions;
    let combinedQuestions = [];
    
    allQuestions.forEach(q => {
      const type1OtherAnswers = allQuestions.filter(sq => sq.id !== q.id).map(sq => sq.answer);
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

      const type2OtherAnswers = allQuestions.filter(sq => sq.id !== q.id).map(sq => sq.question);
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
    if (selectedAnswer !== null) return;
    
    setSelectedAnswer(ans);
    
    const currentQ = questions[currentIndex];
    const isCorrect = ans === currentQ.correctAnswer;
    
    if (!isCorrect) {
      setWrongIds(prev => new Set(prev).add(currentQ.id || currentQ.question));
    }

    // Speak Correct Answer if enabled
    if (autoSpeakAnswer) {
      const ansLang = currentQ.uniqueSessionId.includes('type1') ? 'vi-VN' : 'en-US';
      speakText(currentQ.correctAnswer, ansLang);
    }

    const delay = isCorrect ? 1000 : 5000;
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
    <div translate="no" className="notranslate" style={{ maxWidth: 800, margin: '0 auto', padding: 20 }}>
      
      {/* Settings Modal */}
      <Modal 
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Settings size={20} />
            <span>Voice & Audio Settings</span>
          </div>
        }
        open={showSettings} 
        onOk={() => setShowSettings(false)} 
        onCancel={() => setShowSettings(false)}
        footer={[
          <Button key="ok" type="primary" onClick={() => setShowSettings(false)}>Done</Button>
        ]}
      >
        <div style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <Text strong>Auto-Speak Question</Text>
            <Switch 
              checked={autoSpeakQuestion} 
              onChange={(checked) => { setAutoSpeakQuestion(checked); localStorage.setItem('autoSpeakQuestion', checked); }} 
            />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text strong>Auto-Speak Correct Answer</Text>
            <Switch 
              checked={autoSpeakAnswer} 
              onChange={(checked) => { setAutoSpeakAnswer(checked); localStorage.setItem('autoSpeakAnswer', checked); }} 
            />
          </div>
        </div>
        
        <div style={{ borderTop: '1px solid #f0f0f0', paddingTop: 16, marginBottom: 16 }}>
          <Text strong>English Voice:</Text>
          <Select 
            value={enVoiceURI} 
            onChange={val => { setEnVoiceURI(val); localStorage.setItem('enVoiceURI', val); }} 
            style={{ width: '100%', marginTop: 8 }}
            showSearch
          >
            <Select.Option value="">-- Auto Detect (Default) --</Select.Option>
            {voices.map(v => (
              <Select.Option key={v.voiceURI} value={v.voiceURI}>{v.name} ({v.lang})</Select.Option>
            ))}
          </Select>
        </div>
        <div>
          <Text strong>Vietnamese Voice:</Text>
          <Select 
            value={viVoiceURI} 
            onChange={val => { setViVoiceURI(val); localStorage.setItem('viVoiceURI', val); }} 
            style={{ width: '100%', marginTop: 8 }}
            showSearch
          >
            <Select.Option value="">-- Auto Detect (Default) --</Select.Option>
            {voices.map(v => (
              <Select.Option key={v.voiceURI} value={v.voiceURI}>{v.name} ({v.lang})</Select.Option>
            ))}
          </Select>
        </div>
      </Modal>

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

        <Flex gap="small">
          <Button type="text" disabled>{currentScore}%</Button>
          <Button icon={<Settings size={18} />} onClick={() => setShowSettings(true)} title="Voice Settings" />
        </Flex>
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
        
        <Flex justify="center" gap="small" style={{ marginTop: 10 }}>
          <Button 
            type="dashed" 
            onClick={() => {
              const lang = currentQ.uniqueSessionId.includes('type1') ? 'en-US' : 'vi-VN';
              speakText(currentQ.displayQuestion, lang);
            }}
          >
            Read Aloud 
          </Button>
          {currentQ.hint && (
            <Button 
              type="dashed" 
              icon={<Lightbulb size={16} />} 
              onClick={() => setShowHint(!showHint)}
            >
              Hint
            </Button>
          )}
        </Flex>

        {showHint && currentQ.hint && (
          <div style={{ marginTop: 16, padding: '12px', background: '#fffbe6', border: '1px solid #ffe58f', borderRadius: 8 }}>
            <Text style={{ color: '#d48806', fontSize: '1rem' }}>💡 {currentQ.hint}</Text>
          </div>
        )}
      </Card>

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
                backgroundColor: bgColor, borderColor: borderColor, transition: 'all 0.3s ease',
                borderRadius: 12, height: '100%', minHeight: '120px'
              }}
              bodyStyle={{ 
                padding: '20px', height: '100%', display: 'flex', alignItems: 'center', 
                justifyContent: 'center', textAlign: 'center'
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