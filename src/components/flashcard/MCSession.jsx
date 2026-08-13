import React, { useState, useEffect } from 'react';
import TypeBMCSession from './TypeBMCSession';
import SessionResult from '../SessionResult';
import MCVoiceSettings from './mc/MCVoiceSettings';
import StandardMCPhase from './mc/StandardMCPhase';
import ListeningMCPhase from './mc/ListeningMCPhase';

const MCSession = ({ data, onHome, onBack }) => {
  const isTypeB = data?.type === 'flashcard-b' || data?.questions?.[0]?.type === 'type-b';

  // Điều hướng Game Phase
  const [phase, setPhase] = useState('standard'); // 'standard' -> 'listening' -> 'result'
  const [finalWrongIds, setFinalWrongIds] = useState(new Set());

  // Trạng thái Voice
  const [voices, setVoices] = useState([]);
  const [showSettings, setShowSettings] = useState(false);
  const [enVoiceURI, setEnVoiceURI] = useState(localStorage.getItem('enVoiceURI') || '');
  const [viVoiceURI, setViVoiceURI] = useState(localStorage.getItem('viVoiceURI') || '');
  const [autoSpeakQuestion, setAutoSpeakQuestion] = useState(localStorage.getItem('autoSpeakQuestion') !== 'false');
  const [autoSpeakAnswer, setAutoSpeakAnswer] = useState(localStorage.getItem('autoSpeakAnswer') !== 'false');

  useEffect(() => {
    const loadVoices = () => setVoices(window.speechSynthesis.getVoices());
    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;
    return () => window.speechSynthesis.cancel();
  }, []);

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

  // Giữ nguyên Flow của TypeB vì cấu trúc đặc thù
  if (isTypeB) return <TypeBMCSession data={data} onHome={onHome} onBack={onBack} />;

  // Control Flow Management
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

  // Result view
  if (phase === 'result') {
    const totalUniqueQuestions = data.questions.length;
    const finalScore = Math.max(0, Math.round(((totalUniqueQuestions - finalWrongIds.size) / totalUniqueQuestions) * 100));
    
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
        showSettings={showSettings} setShowSettings={setShowSettings}
        voices={voices} enVoiceURI={enVoiceURI} setEnVoiceURI={setEnVoiceURI}
        viVoiceURI={viVoiceURI} setViVoiceURI={setViVoiceURI}
        autoSpeakQuestion={autoSpeakQuestion} setAutoSpeakQuestion={setAutoSpeakQuestion}
        autoSpeakAnswer={autoSpeakAnswer} setAutoSpeakAnswer={setAutoSpeakAnswer}
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