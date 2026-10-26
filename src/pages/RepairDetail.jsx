// src/pages/RepairDetail.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { Card, Button, Typography, Spin, message } from 'antd';
import { RefreshCw, Trophy } from 'lucide-react';
import { getRepairById } from '../firebase/repairService';
import repairConfig from '../data/system/repair_modes.json';

import RepairHeader from '../components/repair/RepairHeader';
import RepairWorkspace from '../components/repair/RepairWorkspace';
import RepairProgressSidebar from '../components/repair/RepairProgressSidebar';

const { Title, Text } = Typography;

const shuffleQuestions = (array) => {
  const newArr = [...array];
  for (let i = newArr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArr[i], newArr[j]] = [newArr[j], newArr[i]];
  }
  return newArr;
};

const splitTokens = (strOrArr) => {
  if (Array.isArray(strOrArr)) return [...strOrArr];
  if (typeof strOrArr === 'string') {
    return strOrArr.includes('/')
      ? strOrArr.split('/').map((w) => w.trim())
      : strOrArr.split(' ').map((w) => w.trim());
  }
  return [];
};

const RepairDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const percentParam = searchParams.get('percent');
  const numbersParam = searchParams.get('numbers');
  const tagParam = searchParams.get('tag');

  const [repairSet, setRepairSet] = useState(null);
  const [activeQuestions, setActiveQuestions] = useState([]);
  const [loading, setLoading] = useState(true);

  // Session State
  const [sessionState, setSessionState] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [completed, setCompleted] = useState(false);

  // Current Question Local State
  const [availableTokens, setAvailableTokens] = useState([]);
  const [selectedTokens, setSelectedTokens] = useState([]);
  const [isChecked, setIsChecked] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [highlightedTokenId, setHighlightedTokenId] = useState(null);
  const [hintCount, setHintCount] = useState(0);

  const maxHintRatio = repairConfig.settings?.maxHintRatio ?? 0.5;

  const handleBackToList = () => {
    navigate(tagParam ? `/repairs?tag=${encodeURIComponent(tagParam)}` : '/repairs');
  };

  const pickRandomQuestions = (rawQuestions) => {
    if (!rawQuestions || rawQuestions.length === 0) return [];
    let targetCount = rawQuestions.length;
    if (percentParam) {
      const pct = parseFloat(percentParam);
      if (!isNaN(pct) && pct > 0 && pct <= 100) {
        targetCount = Math.max(1, Math.round((rawQuestions.length * pct) / 100));
      }
    } else if (numbersParam) {
      const num = parseInt(numbersParam, 10);
      if (!isNaN(num) && num > 0) {
        targetCount = Math.min(rawQuestions.length, num);
      }
    }
    const shuffled = shuffleQuestions(rawQuestions);
    return shuffled.slice(0, targetCount);
  };

  const initializeSession = (questions) => {
    const initialState = questions.map((q, qIdx) => {
      const rawList = splitTokens(q.question);
      const pool = rawList.filter(Boolean).map((word, wIdx) => ({
        id: `q${qIdx}-w${wIdx}-${word}`,
        word: word,
      }));
      return {
        available: pool,
        selected: [],
        status: 'pending',
        isChecked: false,
        hintCount: 0,
      };
    });
    setSessionState(initialState);
    loadQuestionState(0, initialState);
  };

  const loadQuestionState = (index, currentSessionState = sessionState) => {
    const state = currentSessionState[index];
    if (!state) return;
    setAvailableTokens([...state.available]);
    setSelectedTokens([...state.selected]);
    setIsChecked(state.isChecked);
    setIsCorrect(state.status === 'correct');
    setHighlightedTokenId(null);
    setHintCount(state.hintCount || 0);
    setCurrentIndex(index);
  };

  const updateSessionState = (index, updates) => {
    setSessionState((prev) => {
      const newState = [...prev];
      newState[index] = { ...newState[index], ...updates };
      return newState;
    });
  };

  const loadData = async () => {
    setLoading(true);
    const data = await getRepairById(id);
    if (data && data.questions) {
      setRepairSet(data);
      const chosen = pickRandomQuestions(data.questions);
      setActiveQuestions(chosen);
      initializeSession(chosen);
    } else {
      message.error('Không tìm thấy bài tập!');
      handleBackToList();
    }
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [id, percentParam, numbersParam]);

  const handleSelectWord = (token) => {
    if (isChecked) return;
    const newAvailable = availableTokens.filter((t) => t.id !== token.id);
    const newSelected = [...selectedTokens, token];
    setAvailableTokens(newAvailable);
    setSelectedTokens(newSelected);
    setHighlightedTokenId(null);
    updateSessionState(currentIndex, { available: newAvailable, selected: newSelected });
  };

  const handleRemoveWord = (token) => {
    if (isChecked) return;
    const newSelected = selectedTokens.filter((t) => t.id !== token.id);
    const newAvailable = [...availableTokens, token];
    setSelectedTokens(newSelected);
    setAvailableTokens(newAvailable);
    setHighlightedTokenId(null);
    updateSessionState(currentIndex, { available: newAvailable, selected: newSelected });
  };

  const handleResetCurrent = () => {
    if (isChecked) return;
    const currentQ = activeQuestions[currentIndex];
    const rawList = splitTokens(currentQ.question);
    const pool = rawList.filter(Boolean).map((word, wIdx) => ({
      id: `q${currentIndex}-w${wIdx}-${word}`,
      word: word,
    }));
    setAvailableTokens(pool);
    setSelectedTokens([]);
    setHighlightedTokenId(null);
    setHintCount(0);
    updateSessionState(currentIndex, { available: pool, selected: [], hintCount: 0 });
  };

  // Tính số lượng từ và số lần hint tối đa cho câu hiện tại
  const currentQ = activeQuestions[currentIndex];
  const fullExpectedTokens = currentQ ? splitTokens(currentQ.answer || currentQ.question) : [];
  const maxHintsAllowed = Math.floor(fullExpectedTokens.length * maxHintRatio);

  // LOGIC HELP ME CÓ KIỂM SOÁT TỐI ĐA 50%
  const handleHelpMe = () => {
    if (isChecked || availableTokens.length === 0) return;

    if (hintCount >= maxHintsAllowed) {
      message.warning(repairConfig.settings?.hintHelpText || 'Không thể gợi ý quá 50% số lượng từ của câu!');
      return;
    }

    const nextExpectedWord = fullExpectedTokens[selectedTokens.length];
    if (!nextExpectedWord) {
      message.info('Bạn đã chọn đủ số lượng từ!');
      return;
    }

    const clean = (w) => w.trim().toLowerCase().replace(/[,.!?;:]/g, '');
    const matchedToken = availableTokens.find(
      (t) => clean(t.word) === clean(nextExpectedWord)
    ) || availableTokens[0];

    if (matchedToken) {
      setHighlightedTokenId(matchedToken.id);
      const nextHintCount = hintCount + 1;
      setHintCount(nextHintCount);
      updateSessionState(currentIndex, { hintCount: nextHintCount });
      message.success(`Gợi ý từ tiếp theo: "${matchedToken.word}" (${nextHintCount}/${maxHintsAllowed})`);
    }
  };

  const checkAnswer = () => {
    if (selectedTokens.length === 0) {
      message.warning('Vui lòng chọn từ để ghép thành câu!');
      return;
    }
    const currentSentence = selectedTokens
      .map((t) => t.word)
      .join(' ')
      .replace(/\s+([,!.?;:])/g, '$1')
      .trim();
    const targetAnswer = (activeQuestions[currentIndex].answer || '').trim();
    const correct = currentSentence === targetAnswer;
    setIsCorrect(correct);
    setIsChecked(true);
    setHighlightedTokenId(null);
    updateSessionState(currentIndex, {
      status: correct ? 'correct' : 'incorrect',
      isChecked: true,
      available: availableTokens,
      selected: selectedTokens,
    });
  };

  const nextQuestion = () => {
    const nextIdx = currentIndex + 1;
    if (nextIdx < activeQuestions.length) {
      loadQuestionState(nextIdx);
    } else {
      setCompleted(true);
    }
  };

  const restart = () => {
    setCompleted(false);
    const newPicked = pickRandomQuestions(repairSet.questions);
    setActiveQuestions(newPicked);
    initializeSession(newPicked);
  };

  const calculateScore = () => {
    const correctCount = sessionState.filter((s) => s.status === 'correct').length;
    const total = activeQuestions.length;
    if (total === 0) return '0';
    const scoreOn10 = ((correctCount / total) * 10).toFixed(1);
    return scoreOn10.endsWith('.0') ? scoreOn10.slice(0, -2) : scoreOn10;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spin size="large" />
      </div>
    );
  }

  if (completed) {
    const finalScore = calculateScore();
    const numericScore = parseFloat(finalScore);
    let messageText = 'Hoàn thành bài tập!';
    let colorClass = 'text-blue-500';
    if (numericScore === 10) {
      messageText = 'Xuất sắc!';
      colorClass = 'text-green-500';
    } else if (numericScore < 5) {
      messageText = 'Cần luyện tập thêm!';
      colorClass = 'text-orange-500';
    }

    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-xl rounded-3xl text-center p-8 border-0 bg-white/95 backdrop-blur-sm">
          <div className="mb-6 flex justify-center">
            <div
              className={`p-6 rounded-full bg-opacity-10 ${
                numericScore === 10 ? 'bg-green-500' : 'bg-blue-500'
              }`}
            >
              <Trophy size={64} className={colorClass} />
            </div>
          </div>
          <Title level={2} className="!mb-2">
            {messageText}
          </Title>
          <Text className="text-gray-500 text-lg block mb-8">
            Điểm số: <span className={`font-bold text-3xl ${colorClass}`}>{finalScore}</span> / 10
          </Text>
          <div className="flex flex-col gap-3">
            <Button
              type="primary"
              size="large"
              onClick={restart}
              className="h-12 bg-indigo-600 hover:bg-indigo-500 border-none rounded-xl font-semibold shadow-lg shadow-indigo-200"
              icon={<RefreshCw size={18} />}
            >
              Luyện tập lại
            </Button>
            <Button
              size="large"
              type="text"
              onClick={handleBackToList}
              className="h-12 text-gray-500 hover:bg-gray-100 rounded-xl"
            >
              Quay về danh sách
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  if (!currentQ) return null;

  return (
    <div className="min-h-screen flex flex-col items-center py-6 px-4 font-sans max-w-7xl mx-auto">
      <RepairHeader
        title={repairSet?.title}
        percentParam={percentParam}
        totalCount={activeQuestions.length}
        onBack={handleBackToList}
      />

      <div className="w-full grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-8 items-start">
        <RepairWorkspace
          currentIndex={currentIndex}
          totalQuestions={activeQuestions.length}
          currentQuestion={currentQ}
          availableTokens={availableTokens}
          selectedTokens={selectedTokens}
          isChecked={isChecked}
          isCorrect={isCorrect}
          highlightedTokenId={highlightedTokenId}
          hintCount={hintCount}
          maxHintsAllowed={maxHintsAllowed}
          onSelectWord={handleSelectWord}
          onRemoveWord={handleRemoveWord}
          onResetWords={handleResetCurrent}
          onHelpMe={handleHelpMe}
          onCheckAnswer={checkAnswer}
          onNextQuestion={nextQuestion}
          onFinishSession={() => setCompleted(true)}
        />

        <RepairProgressSidebar
          sessionState={sessionState}
          currentIndex={currentIndex}
          totalQuestions={activeQuestions.length}
          onSelectIndex={loadQuestionState}
        />
      </div>
    </div>
  );
};

export default RepairDetail;