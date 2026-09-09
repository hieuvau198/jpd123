// src/components/quiz_b/QuizBPracticeView.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { CheckCircle, XCircle, ArrowRight, Brain } from 'lucide-react';
import SessionResult from '../SessionResult';

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
  const [sectionScores, setSectionScores] = useState({});
  const [selectedOption, setSelectedOption] = useState(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [isAllFinished, setIsAllFinished] = useState(false);

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
    <div className="w-full flex flex-col gap-6">
      {/* Thanh mục lục số góc cạnh */}
      <div className="w-full flex items-center gap-1 overflow-x-auto px-4 pb-2 border-b border-slate-800 scrollbar-none">
        {sections.map((sec, idx) => (
          <button
            key={sec.section_id || idx}
            onClick={() => setActiveSectionIdx(idx)}
            className={`w-10 h-10 rounded-none text-sm font-bold flex items-center justify-center transition-all flex-shrink-0 border ${
              activeSectionIdx === idx
                ? 'bg-[#29133b] text-fuchsia-300 border-fuchsia-400 shadow-[0_0_10px_rgba(232,121,249,0.3)]'
                : 'bg-[#060a22] text-slate-400 border-slate-800 hover:border-slate-700 hover:text-slate-200'
            }`}
          >
            {idx + 1}
          </button>
        ))}
      </div>

      {/* Card câu hỏi tràn viền */}
      <div className="w-full bg-[#05081f] border-y sm:border border-fuchsia-950/70 p-5 sm:p-8 flex flex-col gap-6 rounded-none shadow-xl">
        {/* Khối nội dung câu hỏi */}
        <div className="w-full p-5 sm:p-6 bg-[#090f33] border border-cyan-950/60 rounded-none">
          <div className="text-slate-100 font-semibold text-base sm:text-xl leading-relaxed">
            {!currentQuestion._firstTry && (
              <span className="inline-block px-2.5 py-0.5 bg-amber-950/70 text-amber-300 border border-amber-500/40 text-xs uppercase font-mono mr-3">
                Làm lại
              </span>
            )}
            {currentQuestion.prompt}
          </div>
        </div>

        {/* Lựa chọn trắc nghiệm góc cạnh tràn viền */}
        <div className="flex flex-col gap-3">
          {currentQuestion.options?.map((opt) => {
            const isSelected = selectedOption === opt.id;
            const isCorrect = opt.id === currentQuestion.correct_option_id;

            let optionClass = 'bg-[#090f33] border-slate-800 text-slate-200 hover:border-cyan-500/60 hover:bg-[#0c1547]';

            if (isAnswered) {
              if (isCorrect) {
                optionClass = 'bg-[#063024] border-emerald-500 text-emerald-300 font-bold shadow-[0_0_12px_rgba(16,185,129,0.2)]';
              } else if (isSelected && !isCorrect) {
                optionClass = 'bg-[#3b0f1d] border-rose-500 text-rose-300';
              } else {
                optionClass = 'bg-[#040718] border-slate-900 text-slate-600 opacity-40';
              }
            }

            return (
              <button
                key={opt.id}
                disabled={isAnswered}
                onClick={() => handleSelectOption(opt.id)}
                className={`w-full min-h-[52px] p-4 text-left rounded-none border transition-all flex justify-between items-center text-sm sm:text-base leading-snug ${optionClass}`}
              >
                <span className="flex-1 pr-3">
                  <strong className="mr-2 text-slate-400 font-mono">{opt.id}.</strong>
                  {opt.text}
                </span>

                {isAnswered && isCorrect && (
                  <CheckCircle size={20} className="text-emerald-400 shrink-0" />
                )}
                {isAnswered && isSelected && !isCorrect && (
                  <XCircle size={20} className="text-rose-400 shrink-0" />
                )}
              </button>
            );
          })}
        </div>

        {/* Giải thích chi tiết */}
        {isAnswered && currentQuestion.explanation && (
          <div className="w-full p-4 bg-[#0a133d] border border-cyan-500/40 text-cyan-200 text-sm flex gap-3 items-start">
            <Brain size={20} className="text-cyan-400 shrink-0 mt-0.5" />
            <div className="flex-1">
              <div className="font-bold uppercase tracking-wider text-xs mb-1 text-cyan-300">
                Giải thích chi tiết
              </div>
              <div className="leading-relaxed text-slate-300">{currentQuestion.explanation}</div>
            </div>
          </div>
        )}

        {/* Nút Tiếp tục */}
        {isAnswered && (
          <div className="flex justify-end mt-2">
            <button
              onClick={handleNext}
              className="w-full sm:w-auto px-10 py-3 rounded-none bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold border-none text-sm tracking-wider uppercase flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(6,182,212,0.3)] transition-all"
            >
              <span>Tiếp tục</span>
              <ArrowRight size={18} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default QuizBPracticeView;