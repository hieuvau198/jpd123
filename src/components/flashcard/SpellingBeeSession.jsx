// src/components/flashcard/SpellingBeeSession.jsx
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Card, Typography, Flex } from 'antd';
import SessionResult from '../SessionResult';
import SpellingBeeHeader from './spellingbee/SpellingBeeHeader';
import SpellingBeeAudioButton from './spellingbee/SpellingBeeAudioButton';
import SpellingBeeMC from './spellingbee/SpellingBeeMC';
import SpellingBeeTyping from './spellingbee/SpellingBeeTyping';

const { Text } = Typography;

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
  const [inputMode, setInputMode] = useState('mc'); // 'mc' | 'typing'
  const [inputValue, setInputValue] = useState("");
  const [selectedMCOption, setSelectedMCOption] = useState(null);
  const [feedback, setFeedback] = useState("neutral"); // 'neutral' | 'correct' | 'wrong'
  const [listenCount, setListenCount] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const [score, setScore] = useState(0);
  
  const inputRef = useRef(null);
  const timerRef = useRef(null);

  // Khởi tạo danh sách câu hỏi
  useEffect(() => {
    if (data && data.questions) {
      setQueue(shuffleArray([...data.questions]));
    }
  }, [data]);

  const currentCard = queue[currentIndex];

  // Options cho trắc nghiệm
  const mcOptions = useMemo(() => {
    if (!currentCard || !data?.questions) return [];
    const correctWord = currentCard.question;
    const otherWords = Array.from(
      new Set(data.questions.map((q) => q.question).filter((w) => w && w !== correctWord))
    );
    const distractors = shuffleArray(otherWords).slice(0, 3);
    return shuffleArray([correctWord, ...distractors]);
  }, [currentCard, data]);

  // Focus input khi ở chế độ typing
  useEffect(() => {
    if (inputMode === 'typing' && feedback === 'neutral' && inputRef.current && !isFinished) {
      inputRef.current.focus();
    }
  }, [currentIndex, feedback, isFinished, inputMode]);

  // Clear timer unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    };
  }, []);

  const handleSpeech = (text) => {
    if (!text || !('speechSynthesis' in window)) return;
    const synth = window.speechSynthesis;
    if (synth.speaking) synth.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';
    utterance.rate = 0.85;
    synth.speak(utterance);
  };

  // Tự động phát âm khi qua từ mới
  useEffect(() => {
    if (queue.length > 0 && !isFinished && feedback === 'neutral' && currentCard) {
      const timer = setTimeout(() => {
        handleSpeech(currentCard.question);
        setListenCount(1);
      }, 300);
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

  // Tự động chuyển câu: 2s với đúng, 5s với sai
  const triggerAutoNext = (isCorrect) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    const delay = isCorrect ? 2000 : 5000;
    timerRef.current = setTimeout(() => {
      handleNext();
    }, delay);
  };

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
    triggerAutoNext(isCorrect);
  };

  const handleTypingSubmit = (e) => {
    if (e) e.preventDefault();
    if (feedback !== 'neutral' || !inputValue.trim()) return;

    const target = currentCard.question.toLowerCase().trim();
    const input = inputValue.toLowerCase().trim();
    const isCorrect = input === target;

    if (isCorrect) {
      setFeedback('correct');
      setScore((prev) => prev + 1);
    } else {
      setFeedback('wrong');
    }
    triggerAutoNext(isCorrect);
  };

  const handleNext = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
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
    if (timerRef.current) clearTimeout(timerRef.current);
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
    <div style={{ maxWidth: 620, margin: '0 auto', padding: '20px 16px', marginTop: 24 }}>
      <SpellingBeeHeader
        onBack={onBack}
        currentIndex={currentIndex}
        total={queue.length}
        inputMode={inputMode}
        setInputMode={setInputMode}
        disabled={feedback !== 'neutral'}
      />

      <Card
        style={{
          borderRadius: 20,
          textAlign: 'center',
          padding: '24px 16px',
          boxShadow: '0 8px 24px rgba(0,0,0,0.06)',
          border: '1px solid #f0f0f0'
        }}
      >
        {/* Nút Audio phát âm */}
        <SpellingBeeAudioButton
          listenCount={listenCount}
          onPlay={playWordAgain}
          disabled={feedback !== 'neutral'}
        />

        {/* PHẦN HIỂN THỊ KẾT QUẢ: Chỉ hiển thị chữ gốc + nghĩa SAU KHI ĐÃ CHỌN/ĐIỀN ĐÁP ÁN */}
        <div style={{ 
          minHeight: 52, 
          marginBottom: 20, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center' 
        }}>
          {feedback !== 'neutral' ? (
            <Flex align="baseline" justify="center" gap={10} wrap="wrap">
              {/* Chữ gốc tiếng Anh */}
              <Text strong style={{ fontSize: '1.6rem', color: feedback === 'correct' ? '#52c41a' : '#ff4d4f' }}>
                {currentCard.question}
              </Text>
              {/* Nghĩa ngắn gọn tiếng Việt đặt ngay cạnh */}
              {currentCard.answer && (
                <Text style={{ fontSize: '1.15rem', color: '#595959', fontWeight: 500 }}>
                  😈({currentCard.answer})
                </Text>
              )}
            </Flex>
          ) : (
            <Text type="secondary" style={{ fontSize: '0.95rem', letterSpacing: 0.3 }}>
              🥸🥸🥸
            </Text>
          )}
        </div>

        {/* Chế độ Trắc nghiệm hoặc Điền từ */}
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

        {/* Thông báo thời gian tự động chuyển câu */}
        {feedback !== 'neutral' && (
          <div style={{ marginTop: 24 }}>
            <Text type="secondary" style={{ fontSize: 13 }}>
              {feedback === 'correct' ? 'Tự động tiếp tục sau 2s...' : 'Tự động tiếp tục sau 5s...'}
            </Text>
          </div>
        )}
      </Card>
    </div>
  );
};

export default SpellingBeeSession;