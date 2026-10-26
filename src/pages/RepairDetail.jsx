// src/pages/RepairDetail.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'; // Thêm useSearchParams
import { Card, Button, Typography, Spin, message } from 'antd';
import { 
  ArrowLeft, 
  RefreshCw, 
  ArrowRight, 
  List as ListIcon, 
  Check, 
  X, 
  RotateCcw, 
  Trophy 
} from 'lucide-react';
import { getRepairById } from '../firebase/repairService';

const { Title, Text } = Typography;

// Hàm shuffle ngẫu nhiên Fisher-Yates
const shuffleQuestions = (array) => {
  const newArr = [...array];
  for (let i = newArr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArr[i], newArr[j]] = [newArr[j], newArr[i]];
  }
  return newArr;
};

const RepairDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Nhận tham số percent hoặc numbers
  const percentParam = searchParams.get('percent');
  const numbersParam = searchParams.get('numbers');

  const [repairSet, setRepairSet] = useState(null);
  const [activeQuestions, setActiveQuestions] = useState([]); // Danh sách câu hỏi đã được chọn ngẫu nhiên
  const [loading, setLoading] = useState(true);

  // --- SESSION STATE CHO TOÀN BỘ PHIÊN LÀM BÀI ---
  const [sessionState, setSessionState] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [completed, setCompleted] = useState(false);

  // --- LOCAL UI STATE (Câu hiện tại) ---
  const [availableTokens, setAvailableTokens] = useState([]);
  const [selectedTokens, setSelectedTokens] = useState([]);
  const [isChecked, setIsChecked] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);

  // Hàm chọn ngẫu nhiên câu hỏi theo cấu hình % hoặc số lượng
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

    // Xáo trộn và lấy đủ số câu theo target
    const shuffled = shuffleQuestions(rawQuestions);
    return shuffled.slice(0, targetCount);
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
      message.error("Không tìm thấy bài tập!");
      navigate('/repairs');
    }
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [id, percentParam, numbersParam]);

  // Khởi tạo session state dựa trên danh sách câu đã chọn
  const initializeSession = (questions) => {
    const initialState = questions.map((q, qIdx) => {
      let rawList = [];
      if (Array.isArray(q.question)) {
        rawList = [...q.question];
      } else if (typeof q.question === 'string') {
        rawList = q.question.includes('/')
          ? q.question.split('/').map(w => w.trim())
          : q.question.split(' ').map(w => w.trim());
      }

      const pool = rawList.filter(Boolean).map((word, wIdx) => ({
        id: `q${qIdx}-w${wIdx}-${word}`,
        word: word
      }));

      return {
        available: pool,
        selected: [],
        status: 'pending',
        isChecked: false
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
    setCurrentIndex(index);
  };

  const updateSessionState = (index, updates) => {
    setSessionState(prev => {
      const newState = [...prev];
      newState[index] = { ...newState[index], ...updates };
      return newState;
    });
  };

  const handleSelectWord = (token) => {
    if (isChecked) return;
    const newAvailable = availableTokens.filter(t => t.id !== token.id);
    const newSelected = [...selectedTokens, token];
    setAvailableTokens(newAvailable);
    setSelectedTokens(newSelected);
    updateSessionState(currentIndex, { available: newAvailable, selected: newSelected });
  };

  const handleRemoveWord = (token) => {
    if (isChecked) return;
    const newSelected = selectedTokens.filter(t => t.id !== token.id);
    const newAvailable = [...availableTokens, token];
    setSelectedTokens(newSelected);
    setAvailableTokens(newAvailable);
    updateSessionState(currentIndex, { available: newAvailable, selected: newSelected });
  };

  const handleResetCurrent = () => {
    if (isChecked) return;
    const currentQ = activeQuestions[currentIndex];
    let rawList = [];
    if (Array.isArray(currentQ.question)) {
      rawList = [...currentQ.question];
    } else {
      rawList = currentQ.question.includes('/')
        ? currentQ.question.split('/').map(w => w.trim())
        : currentQ.question.split(' ').map(w => w.trim());
    }

    const pool = rawList.filter(Boolean).map((word, wIdx) => ({
      id: `q${currentIndex}-w${wIdx}-${word}`,
      word: word
    }));

    setAvailableTokens(pool);
    setSelectedTokens([]);
    updateSessionState(currentIndex, { available: pool, selected: [] });
  };

  const checkAnswer = () => {
    if (selectedTokens.length === 0) {
      message.warning("Vui lòng chọn từ để hoàn thành câu!");
      return;
    }

    const currentSentence = selectedTokens
      .map(t => t.word)
      .join(' ')
      .replace(/\s+([,!.?;:])/g, '$1')
      .trim();

    const targetAnswer = (activeQuestions[currentIndex].answer || '').trim();
    const correct = currentSentence === targetAnswer;

    setIsCorrect(correct);
    setIsChecked(true);
    updateSessionState(currentIndex, {
      status: correct ? 'correct' : 'incorrect',
      isChecked: true,
      available: availableTokens,
      selected: selectedTokens
    });
  };

  const goToQuestion = (index) => {
    loadQuestionState(index);
  };

  const nextQuestion = () => {
    const nextIdx = currentIndex + 1;
    if (nextIdx < activeQuestions.length) {
      goToQuestion(nextIdx);
    } else {
      setCompleted(true);
    }
  };

  // Làm lại: Bốc lại 1 set ngẫu nhiên mới với tỷ lệ ban đầu
  const restart = () => {
    setCompleted(false);
    const newPicked = pickRandomQuestions(repairSet.questions);
    setActiveQuestions(newPicked);
    initializeSession(newPicked);
  };

  const calculateScore = () => {
    const correctCount = sessionState.filter(s => s.status === 'correct').length;
    const total = activeQuestions.length;
    if (total === 0) return "0";
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
    let messageText = "Hoàn thành bài tập!";
    let colorClass = "text-blue-500";
    if (numericScore === 10) { messageText = "Xuất sắc!"; colorClass = "text-green-500"; }
    else if (numericScore < 5) { messageText = "Cần luyện tập thêm!"; colorClass = "text-orange-500"; }

    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-xl rounded-3xl text-center p-8 border-0 bg-white/95 backdrop-blur-sm">
          <div className="mb-6 flex justify-center">
            <div className={`p-6 rounded-full bg-opacity-10 ${numericScore === 10 ? 'bg-green-500' : 'bg-blue-500'}`}>
              <Trophy size={64} className={colorClass} />
            </div>
          </div>
          <Title level={2} className="!mb-2">{messageText}</Title>
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
              onClick={() => navigate('/repairs')}
              className="h-12 text-gray-500 hover:bg-gray-100 rounded-xl"
            >
              Quay về danh sách
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  const currentQ = activeQuestions[currentIndex];
  if (!currentQ) return null;

  return (
    <div className="min-h-screen flex flex-col items-center py-6 px-4 font-sans max-w-7xl mx-auto">
      {/* HEADER */}
      <div className="w-full flex justify-between items-center mb-6 px-2">
        <Button 
          type="text" 
          icon={<ArrowLeft size={20} />} 
          onClick={() => navigate('/repairs')}
          className="hover:bg-white/50 rounded-full text-white/90"
        >
          Thoát
        </Button>
        <div className="flex items-center gap-2">
          <Title level={4} className="!m-0 text-white font-bold hidden sm:block">
            {repairSet.title}
          </Title>
          {percentParam && (
            <span className="bg-indigo-500/80 text-white text-xs px-2.5 py-0.5 rounded-full font-bold">
              {percentParam}% ({activeQuestions.length} câu)
            </span>
          )}
        </div>
        <div className="w-[80px]"></div>
      </div>

      <div className="w-full grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-8 items-start">
        {/* KHUNG LÀM BÀI CHÍNH */}
        <div className="flex flex-col gap-6">
          <Card 
            className="shadow-lg rounded-3xl border-0 overflow-hidden relative bg-white/95 backdrop-blur-sm min-h-[520px] flex flex-col"
            styles={{ body: { padding: '2rem', flex: 1, display: 'flex', flexDirection: 'column' } }}
          >
            {/* Thanh thông tin câu */}
            <div className="flex justify-between items-center mb-4">
              <Text className="text-slate-400 font-semibold text-base">
                Câu {currentIndex + 1} / {activeQuestions.length}
              </Text>
              {isChecked && (
                <span className={`px-3 py-1 rounded-full text-sm font-bold ${
                  isCorrect ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                }`}>
                  {isCorrect ? "Chính xác" : "Chưa chính xác"}
                </span>
              )}
            </div>

            {/* NGHĨA TIẾNG VIỆT */}
            {currentQ.meaning && (
              <div className="mb-6 p-4 rounded-2xl bg-indigo-50/70 border border-indigo-100 text-center">
                <span className="text-xs uppercase font-bold text-indigo-500 tracking-wider block mb-1">
                  Nghĩa
                </span>
                <span className="text-lg font-medium text-slate-800">
                  {currentQ.meaning}
                </span>
              </div>
            )}

            {/* KHUNG 1: CÂU ĐANG GHÉP */}
            <div className="flex flex-col gap-2 mb-6">
              <div className="flex justify-between items-center px-1">
                <Text className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Câu của bạn
                </Text>
                {!isChecked && selectedTokens.length > 0 && (
                  <button 
                    onClick={handleResetCurrent}
                    className="text-xs text-indigo-600 hover:text-indigo-800 flex items-center gap-1 font-semibold"
                  >
                    <RotateCcw size={12} /> Làm lại câu này
                  </button>
                )}
              </div>
              <div className={`min-h-[90px] p-4 rounded-2xl flex flex-wrap gap-2.5 items-center border-2 transition-all ${
                isChecked
                  ? isCorrect 
                    ? 'bg-emerald-50/50 border-emerald-400' 
                    : 'bg-rose-50/50 border-rose-400'
                  : 'bg-slate-50 border-dashed border-slate-300'
              }`}>
                {selectedTokens.length === 0 ? (
                  <span className="text-slate-400 text-sm italic mx-auto">
                    Bấm các từ bên dưới để ghép thành câu
                  </span>
                ) : (
                  selectedTokens.map((token) => (
                    <button
                      key={token.id}
                      type="button"
                      disabled={isChecked}
                      onClick={() => handleRemoveWord(token)}
                      className={`px-4 py-2 rounded-xl font-bold text-base transition-all transform active:scale-95 shadow-sm border ${
                        isChecked 
                          ? isCorrect 
                            ? 'bg-emerald-100 text-emerald-800 border-emerald-300' 
                            : 'bg-rose-100 text-rose-800 border-rose-300'
                          : 'bg-indigo-600 text-white border-indigo-600 hover:bg-rose-500 hover:border-rose-500 hover:text-white cursor-pointer'
                      }`}
                      title={!isChecked ? "Bấm để trả về" : ""}
                    >
                      {token.word}
                    </button>
                  ))
                )}
              </div>
            </div>

            {/* KHUNG 2: DANH SÁCH TỪ CHỌN */}
            <div className="flex flex-col gap-2 flex-grow">
              <Text className="text-xs font-bold text-slate-400 uppercase tracking-wider px-1">
                Kho từ vựng
              </Text>
              <div className="p-4 rounded-2xl bg-slate-100/70 border border-slate-200 min-h-[110px] flex flex-wrap gap-2.5 items-center content-start">
                {availableTokens.length === 0 ? (
                  <span className="text-slate-400 text-sm italic mx-auto">
                    Đã chọn hết các từ
                  </span>
                ) : (
                  availableTokens.map((token) => (
                    <button
                      key={token.id}
                      type="button"
                      disabled={isChecked}
                      onClick={() => handleSelectWord(token)}
                      className={`px-4 py-2.5 rounded-xl font-bold text-base transition-all transform hover:-translate-y-0.5 active:translate-y-0 border-2 border-b-4 ${
                        isChecked
                          ? 'opacity-40 cursor-not-allowed bg-white border-slate-200 text-slate-400'
                          : 'bg-white border-slate-200 border-b-slate-300 text-slate-700 hover:border-indigo-400 hover:text-indigo-600 shadow-sm cursor-pointer'
                      }`}
                    >
                      {token.word}
                    </button>
                  ))
                )}
              </div>
            </div>

            {/* KHU VỰC THAO TÁC / NỘP BÀI */}
            <div className="mt-8 flex flex-col justify-end">
              {isChecked ? (
                <div className="flex flex-col items-center w-full">
                  {!isCorrect && (
                    <div className="mb-5 p-4 rounded-xl bg-rose-50 border border-rose-200 text-center w-full">
                      <Text className="text-slate-500 block text-xs uppercase font-bold tracking-wider mb-1">
                        Đáp án chính xác
                      </Text>
                      <Text className="text-emerald-700 font-bold text-lg">
                        {currentQ.answer}
                      </Text>
                    </div>
                  )}
                  <div className="flex gap-4 w-full">
                    {currentIndex === activeQuestions.length - 1 ? (
                      <Button 
                        type="primary"
                        size="large"
                        onClick={() => setCompleted(true)}
                        className="flex-1 h-12 text-base font-bold rounded-xl bg-slate-900 hover:bg-slate-800 text-white border-none shadow-md"
                      >
                        Xem kết quả tổng kết
                      </Button>
                    ) : (
                      <Button 
                        type="primary"
                        size="large"
                        onClick={nextQuestion}
                        className={`flex-1 h-12 text-base font-bold rounded-xl border-none shadow-md ${
                          isCorrect ? 'bg-emerald-600 hover:bg-emerald-500' : 'bg-slate-900 hover:bg-slate-800'
                        }`}
                        icon={<ArrowRight size={18} />}
                      >
                        Câu tiếp theo
                      </Button>
                    )}
                  </div>
                </div>
              ) : (
                <Button 
                  type="primary"
                  size="large"
                  onClick={checkAnswer}
                  className="w-full h-12 bg-indigo-600 hover:bg-indigo-500 border-none rounded-xl text-base font-bold shadow-lg shadow-indigo-200"
                >
                  Kiểm tra câu
                </Button>
              )}
            </div>
          </Card>
        </div>

        {/* SIDEBAR TIẾN TRÌNH */}
        <div className="bg-white/90 backdrop-blur-sm rounded-3xl p-6 shadow-md border border-slate-100 lg:sticky lg:top-6">
          <div className="flex items-center gap-2 mb-6 text-slate-700 font-bold">
            <ListIcon size={20} />
            <span>Tiến trình</span>
          </div>
          <div className="grid grid-cols-5 lg:grid-cols-4 gap-2.5">
            {sessionState.map((state, idx) => {
              let btnClass = "bg-slate-100 text-slate-500 hover:bg-slate-200 border-slate-200";
              let icon = null;
              if (idx === currentIndex) {
                btnClass = "ring-2 ring-offset-2 ring-indigo-500 bg-white text-indigo-600 border-indigo-200 font-bold";
              } else if (state.status === 'correct') {
                btnClass = "bg-emerald-100 text-emerald-600 border-emerald-200";
                icon = <Check size={14} strokeWidth={3} />;
              } else if (state.status === 'incorrect') {
                btnClass = "bg-rose-100 text-rose-500 border-rose-200";
                icon = <X size={14} strokeWidth={3} />;
              }
              return (
                <button
                  key={idx}
                  onClick={() => goToQuestion(idx)}
                  className={`aspect-square rounded-xl flex flex-col items-center justify-center text-sm font-semibold transition-all border ${btnClass}`}
                >
                  {icon || (idx + 1)}
                </button>
              );
            })}
          </div>

          <div className="mt-8 pt-6 border-t border-slate-100">
            <div className="flex justify-between items-center text-sm text-slate-500 mb-2">
              <span>Đã hoàn thành</span>
              <span className="font-bold text-slate-800">
                {sessionState.filter(s => s.status !== 'pending').length} / {activeQuestions.length}
              </span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
              <div 
                className="bg-indigo-600 h-full transition-all duration-300"
                style={{ width: `${(sessionState.filter(s => s.status !== 'pending').length / activeQuestions.length) * 100}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RepairDetail;