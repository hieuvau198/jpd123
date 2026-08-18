// src/components/flashcard/MCSession.jsx
import React, { useState } from 'react';
import TypeBMCSession from './TypeBMCSession';
import SessionResult from '../SessionResult';
import MCVoiceSettings from './mc/MCVoiceSettings';
import StandardMCPhase from './mc/StandardMCPhase';
import ListeningMCPhase from './mc/ListeningMCPhase';

const MCSession = ({ data, onHome, onBack }) => {
  const isTypeB = data?.type === 'flashcard-b' || data?.questions?.[0]?.type === 'type-b';

  const [phase, setPhase] = useState('standard'); // 'standard' -> 'listening' -> 'result'
  const [finalWrongIds, setFinalWrongIds] = useState(new Set());
  const [showSettings, setShowSettings] = useState(false);
  const [autoSpeakQuestion, setAutoSpeakQuestion] = useState(localStorage.getItem('autoSpeakQuestion') !== 'false');
  const [autoSpeakAnswer, setAutoSpeakAnswer] = useState(localStorage.getItem('autoSpeakAnswer') !== 'false');

  const speakText = (text, lang = 'en-US') => {
    if (!text || typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = lang;
      utterance.rate = 0.9;
      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.warn("Speech synthesis failed:", e);
    }
  };

  if (isTypeB) return <TypeBMCSession data={data} onHome={onHome} onBack={onBack} />;

  const handleStandardComplete = (wrongIds) => {
    setFinalWrongIds(wrongIds);
    setPhase('listening');
  };

  const handleListeningComplete = (wrongIds) => {
    setFinalWrongIds(wrongIds);
    setPhase('result');
  };

  const handleRestart = () => {
    setFinalWrongIds(new Set());
    setPhase('standard');
  };

  if (phase === 'result') {
    const totalUniqueQuestions = data?.questions?.length || 0;
    const finalScore = totalUniqueQuestions > 0 
      ? Math.max(0, Math.round(((totalUniqueQuestions - finalWrongIds.size) / totalUniqueQuestions) * 100))
      : 0;

    return (
      <SessionResult
        score={finalScore}
        resultMessage={`"${data?.title || 'current'}": Standard & Listening Completed!`}
        onBack={onBack}
        onRestart={handleRestart}
        practiceId={data.id}
        practiceType="Flashcard"
        practiceName={data.title}
      />
    );
  }

  return (
    <>
      <MCVoiceSettings
        showSettings={showSettings}
        setShowSettings={setShowSettings}
        autoSpeakQuestion={autoSpeakQuestion}
        setAutoSpeakQuestion={setAutoSpeakQuestion}
        autoSpeakAnswer={autoSpeakAnswer}
        setAutoSpeakAnswer={setAutoSpeakAnswer}
      />
      {phase === 'standard' && (
        <StandardMCPhase
          data={data}
          onComplete={handleStandardComplete}
          onBack={onBack}
          speakText={speakText}
          setShowSettings={setShowSettings}
          autoSpeakQuestion={autoSpeakQuestion}
          autoSpeakAnswer={autoSpeakAnswer}
        />
      )}
      {phase === 'listening' && (
        <ListeningMCPhase
          data={data}
          onComplete={handleListeningComplete}
          onBack={onBack}
          initialWrongIds={finalWrongIds}
          speakText={speakText}
        />
      )}
    </>
  );
};

export default MCSession;