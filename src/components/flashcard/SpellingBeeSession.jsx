// src/components/flashcard/SpellingBeeSession.jsx
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Card, Typography, Flex, Tag } from 'antd';
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
  const isTypeB = data?.type === 'flashcard-b' || data?.questions?.some(q => q.misspell && q.misspell.length > 0);

  // Phase: 'standard' -> 'misspell' (chỉ dành cho type-b có misspell) -> hoàn thành
  const [phase, setPhase] = useState('standard');
  const [queue, setQueue] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [inputMode, setInputMode] = useState('mc'); // 'mc' | 'typing'
  const [inputValue, setInputValue] = useState("");
  const [selectedMCOption, setSelectedMCOption] = useState(null);
  const [feedback, setFeedback] = useState("neutral"); // 'neutral' | 'correct' | 'wrong'
  const [listenCount, setListenCount] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const [score, setScore] = useState(0);
  const [totalQuestionsCount, setTotalQuestionsCount] = useState(0);

  const inputRef = useRef(null);
  const timerRef = useRef(null);

  // Khởi tạo queue cho phase hiện tại
  const initPhaseQueue = (phaseType) => {
    if (!data?.questions) return [];
    if (phaseType === 'misspell') {
      // Lọc các câu có misspell
      const misspellCards = data.questions.filter(q => q.misspell && q.misspell.length > 0);
      return shuffleArray(misspellCards).map(q => ({
        ...q,
        isMisspellPhase: true
      }));
    }
    // Phase standard
    return shuffleArray([...data.questions]);
  };

  useEffect(() => {
    if (data && data.questions) {
      const initialQ = initPhaseQueue('standard');
      setQueue(initialQ);
      // Tính tổng số câu hỏi (nếu type-b thì cộng thêm số câu misspell ở sau)
      const misspellCount = data.questions.filter(q => q.misspell && q.misspell.length > 0).length;
      setTotalQuestionsCount(data.questions.length + (isTypeB ? misspellCount : 0));
    }
  }, [data, isTypeB]);

  const currentCard = queue[currentIndex];

  // Options cho trắc nghiệm
  const mcOptions = useMemo(() => {
    if (!currentCard || !data?.questions) return [];
    const correctWord = currentCard.question || currentCard.word;

    // Nếu đang ở Phase Misspell: 4 đáp án gồm từ gốc và 3 từ misspell
    if (currentCard.isMisspellPhase && currentCard.misspell && currentCard.misspell.length > 0) {
      const distractors = currentCard.misspell.slice(0, 3);
      return shuffleArray([correctWord, ...distractors]);
    }

    // Phase thông thường: 1 từ đúng + 3 từ ngẫu nhiên khác trong set
    const otherWords = Array.from(
      new Set(data.questions.map((q) => q.question || q.word).filter((w) => w && w !== correctWord))
    );
    const distractors = shuffleArray(otherWords).slice(0, 3);
    return shuffleArray([correctWord, ...distractors]);
  }, [currentCard, data]);

  // Focus input khi typing
  useEffect(() => {
    if (inputMode === 'typing' && feedback === 'neutral' && inputRef.current && !isFinished) {
      inputRef.current.focus();
    }
  }, [currentIndex, feedback, isFinished, inputMode]);

  // Clear timer khi unmount
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

  // Tự động phát âm khi chuyển từ mới
  useEffect(() => {
    if (queue.length > 0 && !isFinished && feedback === 'neutral' && currentCard) {
      const timer = setTimeout(() => {
        handleSpeech(currentCard.question || currentCard.word);
        setListenCount(1);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [currentIndex, queue, isFinished, feedback]);

  const playWordAgain = () => {
    if (listenCount < 4 && currentCard) {
      handleSpeech(currentCard.question || currentCard.word);
      setListenCount((prev) => prev + 1);
      if (inputMode === 'typing' && inputRef.current) {
        inputRef.current.focus();
      }
    }
  };

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
    const target = (currentCard.question || currentCard.word || '').toLowerCase().trim();
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
    const target = (currentCard.question || currentCard.word || '').toLowerCase().trim();
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
      // Khi xong Phase 1, kiểm tra có chuyển sang Phase 2 (Misspell) không
      if (phase === 'standard' && isTypeB) {
        const misspellQueue = initPhaseQueue('misspell');
        if (misspellQueue.length > 0) {
          setPhase('misspell');
          setQueue(misspellQueue);
          setCurrentIndex(0);
          setInputMode('mc'); // Set Misspell bắt buộc ở dạng trắc nghiệm 4 đáp án
          setInputValue("");
          setSelectedMCOption(null);
          setFeedback('neutral');
          setListenCount(0);
          return;
        }
      }
      setIsFinished(true);
    }
  };

  const restart = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setPhase('standard');
    setQueue(initPhaseQueue('standard'));
    setCurrentIndex(0);
    setScore(0);
    setIsFinished(false);
    setInputValue("");
    setSelectedMCOption(null);
    setFeedback('neutral');
    setListenCount(0);
  };

  if (isFinished) {
    const total = totalQuestionsCount || queue.length;
    const calculatedScore = Math.max(0, Math.round((score / total) * 100));
    return (
      <SessionResult
        score={calculatedScore}
        resultMessage={`"${data?.title || 'current'}": Hoàn thành Spelling Bee & Phân biệt chính tả (${total} câu)!`}
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
        disabled={feedback !== 'neutral' || currentCard.isMisspellPhase} // Khoá chuyển mode nếu đang ở set Misspell trắc nghiệm
      />

      {currentCard.isMisspellPhase && (
        <Flex justify="center" style={{ marginBottom: 12 }}>
          <Tag color="orange" style={{ padding: '4px 12px', fontSize: '13px', borderRadius: 8 }}>
            🎯 Phase 2: Chọn từ có chính tả ĐÚNG
          </Tag>
        </Flex>
      )}

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

        {/* Kết quả sau khi bấm */}
        <div style={{
          minHeight: 52,
          marginBottom: 20,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          {feedback !== 'neutral' ? (
            <Flex align="baseline" justify="center" gap={10} wrap="wrap">
              <Text strong style={{ fontSize: '1.6rem', color: feedback === 'correct' ? '#52c41a' : '#ff4d4f' }}>
                {currentCard.question || currentCard.word}
              </Text>
              {currentCard.answer && (
                <Text style={{ fontSize: '1.15rem', color: '#595959', fontWeight: 500 }}>
                  ({currentCard.answer})
                </Text>
              )}
            </Flex>
          ) : (
            <Text type="secondary" style={{ fontSize: '0.95rem', letterSpacing: 0.3 }}>
              {currentCard.isMisspellPhase
                ? "Nghe và tìm từ được viết ĐÚNG chính tả"
                : (currentCard.answer ? `Nghĩa: ${currentCard.answer}` : "")}
            </Text>
          )}
        </div>

        {/* Trắc nghiệm hoặc Gõ phím */}
        {inputMode === 'mc' ? (
          <SpellingBeeMC
            options={mcOptions}
            selectedOption={selectedMCOption}
            correctAnswer={currentCard.question || currentCard.word}
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

        {/* Auto next notification */}
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