// src/components/flashcard/TypeBMCSession.jsx
import React, { useState, useEffect, useRef } from 'react';
import { Card, Button, Typography, Flex, Progress, Modal, Select } from 'antd';
import { ArrowLeft, Settings } from 'lucide-react';
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

const TypeBMCSession = ({ data, onHome, onBack }) => {
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [wrongIds, setWrongIds] = useState(new Set());
  const timerRef = useRef(null);
  const [totalUniqueQuestions, setTotalUniqueQuestions] = useState(0);

  // --- VOICE SETTINGS STATE ---
  const [voices, setVoices] = useState([]);
  const [showSettings, setShowSettings] = useState(false);
  const [enVoiceURI, setEnVoiceURI] = useState(localStorage.getItem('enVoiceURI') || '');
  const [viVoiceURI, setViVoiceURI] = useState(localStorage.getItem('viVoiceURI') || '');

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
    if (data && data.questions) {
      initGame();
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      window.speechSynthesis.cancel();
    };
  }, [data]);

  // Auto Read Out Loud
  useEffect(() => {
    if (questions.length > 0 && !isFinished) {
      const currentQ = questions[currentIndex];
      speakText(currentQ.displayQuestion, currentQ.qLang || 'en-US');
    }
  }, [currentIndex, questions, isFinished, voices]);

  const initGame = () => {
    const allCards = data.questions;

    let defs = [];
    let reverseDefs = []; 
    let phrases = [];
    let sentences = [];
    let misspells = [];

    allCards.forEach((card, cIdx) => {
      if (card.defs && card.defs.length > 0) {
        const def = card.defs[0];
        defs.push({
          id: `${card.word}_def_${cIdx}`,
          phase: 'Definition',
          displayQuestion: card.word,
          correctAnswer: def.m,
          options: shuffleArray([def.m, ...def.wm.slice(0, 3)]),
          correctAttemptsNeeded: 1,
          qLang: 'en-US',
          aLang: 'vi-VN'
        });

        const otherWords = allCards.filter(c => c.word !== card.word).map(c => c.word);
        const distractors = shuffleArray(otherWords).slice(0, 3);
        
        reverseDefs.push({
          id: `${card.word}_reverse_${cIdx}`,
          phase: 'Reverse',
          displayQuestion: def.m,
          correctAnswer: card.word,
          options: shuffleArray([card.word, ...distractors]),
          correctAttemptsNeeded: 1,
          qLang: 'vi-VN',
          aLang: 'en-US'
        });
      }

      if (card.phrases && card.phrases.length > 0) {
        const p = shuffleArray(card.phrases)[0];
        phrases.push({
          id: `${card.word}_phrase_${cIdx}`,
          phase: 'Phrase',
          displayQuestion: p.text,
          correctAnswer: p.m,
          options: shuffleArray([p.m, ...p.wm.slice(0, 3)]),
          correctAttemptsNeeded: 1,
          qLang: 'en-US',
          aLang: 'vi-VN'
        });
      }

      if (card.sentences && card.sentences.length > 0) {
        const s = shuffleArray(card.sentences)[0];
        sentences.push({
          id: `${card.word}_sentence_${cIdx}`,
          phase: 'Sentence',
          displayQuestion: s.text,
          correctAnswer: s.m,
          options: shuffleArray([s.m, ...s.wm.slice(0, 3)]),
          correctAttemptsNeeded: 1,
          qLang: 'en-US',
          aLang: 'vi-VN'
        });
      }

      if (card.misspell && card.misspell.length > 0 && card.defs && card.defs.length > 0) {
        const def = card.defs[0];
        misspells.push({
          id: `${card.word}_misspell_${cIdx}`,
          phase: 'Misspell',
          displayQuestion: def.m, 
          correctAnswer: card.word,
          options: shuffleArray([card.word, ...card.misspell.slice(0, 3)]),
          correctAttemptsNeeded: 1,
          qLang: 'vi-VN',
          aLang: 'en-US'
        });
      }
    });

    const combinedQuestions = [
      ...shuffleArray(defs),
      ...shuffleArray(reverseDefs),
      ...shuffleArray(phrases),
      ...shuffleArray(sentences),
      ...shuffleArray(misspells)
    ];

    setQuestions(combinedQuestions);
    setTotalUniqueQuestions(combinedQuestions.length);
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
      setWrongIds(prev => new Set(prev).add(currentQ.id));
    }

    // Speak Correct Answer using robust function
    speakText(currentQ.correctAnswer, currentQ.aLang || 'vi-VN');

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
  const progressPercent = Math.round((currentIndex / questions.length) * 100);
  const currentScore = totalUniqueQuestions > 0 ? Math.max(0, Math.round(((totalUniqueQuestions - wrongIds.size) / totalUniqueQuestions) * 100)) : 0;

  return (
    <div translate="no" className="notranslate" style={{ maxWidth: 800, margin: '0 auto', padding: 20 }}>
      
      {/* Settings Modal */}
      <Modal 
        title="Voice Settings" 
        open={showSettings} 
        onOk={() => setShowSettings(false)} 
        onCancel={() => setShowSettings(false)}
        footer={[
          <Button key="ok" type="primary" onClick={() => setShowSettings(false)}>Done</Button>
        ]}
      >
        <div style={{ marginBottom: 16 }}>
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
                <Text strong>{currentQ.phase} Phase</Text>
                <Text type="secondary" style={{ fontSize: '12px' }}>
                  {currentIndex + 1} / {questions.length}
                </Text>
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
        
        <Button 
          type="dashed" 
          onClick={() => speakText(currentQ.displayQuestion, currentQ.qLang || 'en-US')}
          style={{ marginTop: 10 }}
        >
          Read Aloud 
        </Button>
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

export default TypeBMCSession;