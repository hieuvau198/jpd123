// src/components/quiz_b/QuizBPracticeView.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { Button, Typography, Alert, Tag } from 'antd';
import { CheckCircle, XCircle, ArrowRight, Brain } from 'lucide-react';
import SessionResult from '../SessionResult';

const { Title } = Typography;

const shuffleArray = (arr) => {
  const cloned = [...arr];
  for (let i = cloned.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [cloned[i], cloned[j]] = [cloned[j], cloned[i]];
  }
  return cloned;
};

const QuizBPracticeView = ({ practiceData, quizId, quizTitle, onHome }) => {
  const sections = practiceData?.sections || [];
  const [activeSectionIdx, setActiveSectionIdx] = useState(0);
  const [questionsQueue, setQuestionsQueue] = useState([]);
  
  // Lưu số câu đúng ở lần đầu cho từng section: { [secIndex]: score }
  const [sectionScores, setSectionScores] = useState({});
  const [selectedOption, setSelectedOption] = useState(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [isAllFinished, setIsAllFinished] = useState(false);

  // Tổng số câu hỏi gốc của toàn bộ practice
  const totalOriginalQuestions = useMemo(() => {
    return sections.reduce((acc, sec) => acc + (sec.questions?.length || 0), 0);
  }, [sections]);

  const loadSection = (idx) => {
    const sec = sections[idx];
    if (!sec || !sec.questions?.length) return;
    const config = sec.config || {};

    let rawList = sec.questions.map((q) => {
      let opts = q.options ? [...q.options] : [];
      if (config.shuffle_options) opts = shuffleArray(opts);
      return {
        ...q,
        options: opts,
        _firstTry: true,
      };
    });

    if (config.shuffle_questions) {
      rawList = shuffleArray(rawList);
    }

    setQuestionsQueue(rawList);
    setSelectedOption(null);
    setIsAnswered(false);
  };

  useEffect(() => {
    loadSection(activeSectionIdx);
  }, [activeSectionIdx]);

  const currentQuestion = questionsQueue[0];
  const currentSection = sections[activeSectionIdx];

  const handleSelectOption = (optId) => {
    if (isAnswered) return;
    setSelectedOption(optId);
    setIsAnswered(true);

    const isCorrect = optId === currentQuestion.correct_option_id;
    if (isCorrect && currentQuestion._firstTry) {
      setSectionScores((prev) => ({
        ...prev,
        [activeSectionIdx]: (prev[activeSectionIdx] || 0) + 1,
      }));
    }
  };

  const handleNext = () => {
    const isCorrect = selectedOption === currentQuestion.correct_option_id;
    const secConfig = currentSection?.config || {};
    let nextQueue = [...questionsQueue];
    const finishedQ = nextQueue.shift();

    if (!isCorrect && secConfig.repeat_wrong_answers) {
      nextQueue.push({
        ...finishedQ,
        _firstTry: false,
        options: secConfig.shuffle_options ? shuffleArray(finishedQ.options) : finishedQ.options,
      });
    }

    setQuestionsQueue(nextQueue);
    setSelectedOption(null);
    setIsAnswered(false);

    // Tự động chuyển thẳng sang block kế tiếp hoặc màn hình kết quả
    if (nextQueue.length === 0) {
      if (activeSectionIdx + 1 < sections.length) {
        setActiveSectionIdx((prev) => prev + 1);
      } else {
        setIsAllFinished(true);
      }
    }
  };

  if (isAllFinished) {
    const totalCorrect = Object.values(sectionScores).reduce((a, b) => a + b, 0);
    const finalScore = totalOriginalQuestions > 0 
      ? Math.round((totalCorrect / totalOriginalQuestions) * 100) 
      : 100;

    return (
      <SessionResult
        score={finalScore}
        practiceId={quizId}
        practiceType="Quiz"
        practiceName={quizTitle}
        backText="Quay lại"
        restartText="Luyện tập lại"
        resultMessage={`Đúng ${totalCorrect}/${totalOriginalQuestions} câu hỏi gốc trên toàn bộ bài.`}
        onBack={onHome}
        onRestart={() => {
          setIsAllFinished(false);
          setSectionScores({});
          setActiveSectionIdx(0);
          loadSection(0);
        }}
      />
    );
  }

  if (!currentQuestion) return null;

  return (
    <div className="flex flex-col gap-5 w-full">
      {/* Mục lục section chỉ hiển thị số: 1, 2, 3... */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none border-b border-slate-200/50 touch-pan-x">
        {sections.map((sec, idx) => (
          <button
            key={sec.section_id || idx}
            onClick={() => setActiveSectionIdx(idx)}
            className={`w-10 h-10 rounded-2xl text-xs sm:text-sm font-semibold flex items-center justify-center transition-all duration-200 flex-shrink-0 ${
              activeSectionIdx === idx
                ? 'bg-slate-900 text-white shadow-md shadow-slate-900/20 scale-105'
                : 'bg-white/80 text-slate-500 hover:bg-white hover:text-slate-900 border border-slate-200/60'
            }`}
          >
            {idx + 1}
          </button>
        ))}
      </div>

      {/* Main Practice Card */}
      <div className="bg-white/95 backdrop-blur-md rounded-3xl p-5 sm:p-7 shadow-[0_10px_30px_rgb(0,0,0,0.03)] border border-slate-100 flex flex-col">
        {/* Hộp câu hỏi */}
        <div className="p-5 sm:p-6 bg-slate-50/70 rounded-2xl mb-5 sm:mb-6 border border-slate-200/50">
          <Title level={4} className="!m-0 text-slate-800 !text-base sm:!text-lg font-semibold leading-relaxed">
            {!currentQuestion._firstTry && (
              <Tag color="orange" className="mr-2 mb-1 rounded-lg">Làm lại</Tag>
            )}
            {currentQuestion.prompt}
          </Title>
        </div>

        {/* Các lựa chọn phương án trắc nghiệm */}
        <div className="flex flex-col gap-3 mb-4">
          {currentQuestion.options?.map((opt) => {
            const isSelected = selectedOption === opt.id;
            const isCorrect = opt.id === currentQuestion.correct_option_id;

            let optionClass = 'bg-white text-slate-700 border-slate-200/80 hover:border-purple-300 hover:bg-slate-50/50';

            if (isAnswered) {
              if (isCorrect) {
                optionClass = 'bg-emerald-50 text-emerald-800 border-emerald-500 font-medium shadow-xs';
              } else if (isSelected && !isCorrect) {
                optionClass = 'bg-red-50 text-red-700 border-red-400';
              } else {
                optionClass = 'bg-white/60 text-slate-400 border-slate-200/60 opacity-60';
              }
            }

            return (
              <button
                key={opt.id}
                disabled={isAnswered}
                onClick={() => handleSelectOption(opt.id)}
                className={`w-full min-h-[52px] p-3.5 px-4 text-left rounded-2xl border-2 transition-all duration-200 flex justify-between items-center text-sm sm:text-base leading-snug active:scale-[0.99] ${optionClass}`}
              >
                <span className="flex-1 pr-3">
                  <strong className="mr-2 text-slate-400">{opt.id}.</strong>
                  {opt.text}
                </span>

                {isAnswered && isCorrect && (
                  <CheckCircle size={20} className="text-emerald-600 shrink-0" />
                )}
                {isAnswered && isSelected && !isCorrect && (
                  <XCircle size={20} className="text-red-500 shrink-0" />
                )}
              </button>
            );
          })}
        </div>

        {/* Giải thích chi tiết */}
        {isAnswered && currentQuestion.explanation && (
          <Alert
            message={<span className="font-semibold text-xs sm:text-sm">Giải thích chi tiết</span>}
            description={<span className="text-xs sm:text-sm leading-relaxed text-slate-600">{currentQuestion.explanation}</span>}
            type="info"
            showIcon
            icon={<Brain size={18} className="text-blue-500" />}
            className="my-3 rounded-2xl border border-blue-100 bg-blue-50/40"
          />
        )}

        {/* Nút Tiếp tục */}
        {isAnswered && (
          <div className="flex justify-end mt-4">
            <Button
              type="primary"
              size="large"
              icon={<ArrowRight size={18} />}
              onClick={handleNext}
              className="w-full sm:w-auto px-8 rounded-2xl bg-slate-900 hover:bg-slate-800 border-none font-semibold h-12 text-base flex items-center justify-center gap-2 shadow-sm text-white"
            >
              Tiếp tục
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default QuizBPracticeView;