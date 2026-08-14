// src/components/flashcard/SpellingBeeSession.jsx
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Card } from 'antd';
import SessionResult from '../SessionResult';
import SpellingBeeHeader from './spellingbee/SpellingBeeHeader';
import SpellingBeeAudioButton from './spellingbee/SpellingBeeAudioButton';
import SpellingBeeMC from './spellingbee/SpellingBeeMC';
import SpellingBeeTyping from './spellingbee/SpellingBeeTyping';
import SpellingBeeFeedback from './spellingbee/SpellingBeeFeedback';

const shuffleArray = (array) => {
  const newArr = [...array];
  for (let i = newArr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArr[i], newArr[j]] = [newArr[j], newArr[i]];
  }
  return newArr;
};

const SpellingBeeSession = ({ data, onBack }) => {
  const [queue, setQueue] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  
  // Chế độ mặc định là 'mc' (Multiple Choice), người dùng có thể đổi sang 'typing'
  const [inputMode, setInputMode] = useState('mc'); 
  
  const [inputValue, setInputValue] = useState("");
  const [selectedMCOption, setSelectedMCOption] = useState(null);
  const [feedback, setFeedback] = useState("neutral"); // 'neutral' | 'correct' | 'wrong'
  const [listenCount, setListenCount] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const [score, setScore] = useState(0);

  const inputRef = useRef(null);

  // Khởi tạo danh sách câu hỏi
  useEffect(() => {
    if (data && data.questions) {
      setQueue(shuffleArray([...data.questions]));
    }
  }, [data]);

  const currentCard = queue[currentIndex];

  // Sinh 4 options cho chế độ Multiple Choice (1 từ đúng + 3 từ ngẫu nhiên khác trong bộ dữ liệu)
  const mcOptions = useMemo(() => {
    if (!currentCard || !data?.questions) return [];
    
    const correctWord = currentCard.question;
    const otherWords = Array.from(
      new Set(data.questions.map((q) => q.question).filter((w) => w && w !== correctWord))
    );
    const distractors = shuffleArray(otherWords).slice(0, 3);
    return shuffleArray([correctWord, ...distractors]);
  }, [currentCard, data]);

  // Focus input khi chuyển qua chế độ typing
  useEffect(() => {
    if (inputMode === 'typing' && feedback === 'neutral' && inputRef.current && !isFinished) {
      inputRef.current.focus();
    }
  }, [currentIndex, feedback, isFinished, inputMode]);

  const handleSpeech = (text) => {
    if (!text || !('speechSynthesis' in window)) return;
    const synth = window.speechSynthesis;
    if (synth.speaking) synth.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';
    utterance.rate = 0.85;
    synth.speak(utterance);
  };

  // Tự động phát âm khi chuyển sang từ mới
  useEffect(() => {
    if (queue.length > 0 && !isFinished && feedback === 'neutral' && currentCard) {
      const timer = setTimeout(() => {
        handleSpeech(currentCard.question);
        setListenCount(1);
      }, 400);
      return () => clearTimeout(timer);
    }
  }, [currentIndex, queue, isFinished]);

  const playWordAgain = () => {
    if (listenCount < 4 && currentCard) {
      handleSpeech(currentCard.question);
      setListenCount((prev) => prev + 1);
      if (inputMode === 'typing' && inputRef.current) {
        inputRef.current.focus();
      }
    }
  };

  // Xử lý chọn đáp án Multiple Choice
  const handleSelectMCOption = (option) => {
    if (feedback !== 'neutral' || selectedMCOption !== null) return;
    setSelectedMCOption(option);
    
    const target = (currentCard.question || '').toLowerCase().trim();
    const isCorrect = (option || '').toLowerCase().trim() === target;

    if (isCorrect) {
      setFeedback('correct');
      setScore((prev) => prev + 1);
    } else {
      setFeedback('wrong');
    }
  };

  // Xử lý nộp bài Typing
  const handleTypingSubmit = (e) => {
    e.preventDefault();
    if (feedback !== 'neutral') {
      handleNext();
      return;
    }
    if (!inputValue.trim()) return;

    const target = currentCard.question.toLowerCase().trim();
    const input = inputValue.toLowerCase().trim();

    if (input === target) {
      setFeedback('correct');
      setScore((prev) => prev + 1);
    } else {
      setFeedback('wrong');
    }
  };

  const handleNext = () => {
    if (currentIndex + 1 < queue.length) {
      setCurrentIndex((prev) => prev + 1);
      setInputValue("");
      setSelectedMCOption(null);
      setFeedback('neutral');
      setListenCount(0);
    } else {
      setIsFinished(true);
    }
  };

  const restart = () => {
    setQueue(shuffleArray([...data.questions]));
    setCurrentIndex(0);
    setScore(0);
    setIsFinished(false);
    setInputValue("");
    setSelectedMCOption(null);
    setFeedback('neutral');
    setListenCount(0);
  };

  if (isFinished) {
    const calculatedScore = Math.max(0, Math.round((score / queue.length) * 100));
    return (
      <SessionResult
        score={calculatedScore}
        resultMessage={`"${data?.title || 'current'}": Spell ${queue.length} words!`}
        onBack={onBack}
        onRestart={restart}
        practiceId={data.id}
        practiceType="Flashcard"
        practiceName={data.title}
      />
    );
  }

  if (!queue.length || !currentCard) return null;

  return (
    <div style={{ maxWidth: 650, margin: '0 auto', padding: 20, marginTop: 40 }}>
      {/* Header với 2 nút chuyển chế độ Trắc nghiệm <-> Điền từ */}
      <SpellingBeeHeader
        onBack={onBack}
        currentIndex={currentIndex}
        total={queue.length}
        inputMode={inputMode}
        setInputMode={setInputMode}
        disabled={feedback !== 'neutral'}
      />

      <Card style={{ textAlign: 'center', padding: '30px 20px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
        {/* Nút Audio nghe âm thanh */}
        <SpellingBeeAudioButton
          listenCount={listenCount}
          onPlay={playWordAgain}
          disabled={feedback !== 'neutral'}
        />

        {/* Nội dung câu hỏi theo Mode được chọn */}
        {inputMode === 'mc' ? (
          <SpellingBeeMC
            options={mcOptions}
            selectedOption={selectedMCOption}
            correctAnswer={currentCard.question}
            onSelectOption={handleSelectMCOption}
            disabled={feedback !== 'neutral'}
          />
        ) : (
          <SpellingBeeTyping
            inputRef={inputRef}
            inputValue={inputValue}
            setInputValue={setInputValue}
            onSubmit={handleTypingSubmit}
            feedback={feedback}
            disabled={feedback !== 'neutral'}
          />
        )}

        {/* Khối phản hồi Đúng / Sai sau khi làm câu hỏi */}
        <SpellingBeeFeedback
          feedback={feedback}
          currentCard={currentCard}
          onNext={handleNext}
        />
      </Card>
    </div>
  );
};

export default SpellingBeeSession;