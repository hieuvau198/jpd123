// src/components/quiz_b/QuizBPracticeView.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { 
  CheckCircle, 
  XCircle, 
  ArrowRight, 
  Brain, 
  AlertCircle, 
  Lightbulb, 
  BookA 
} from 'lucide-react';
import SessionResult from '../SessionResult';

const shuffleArray = (arr) => {
  const cloned = [...arr];
  for (let i = cloned.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [cloned[i], cloned[j]] = [cloned[j], cloned[i]];
  }
  return cloned;
};

// Helper to support both real '\n' and literal string '\n' breaks
const renderTextWithNewlines = (content) => {
  if (typeof content !== 'string') return content;
  const normalized = content.replace(/\\n/g, '\n');
  return normalized.split('\n').map((line, idx, arr) => (
    <React.Fragment key={idx}>
      {line}
      {idx < arr.length - 1 && <br />}
    </React.Fragment>
  ));
};

const QuizBPracticeView = ({ practiceData, quizId, quizTitle, onHome }) => {
  const sections = practiceData?.sections || [];
  const [activeSectionIdx, setActiveSectionIdx] = useState(0);
  const [questionsQueue, setQuestionsQueue] = useState([]);
  const [sectionScores, setSectionScores] = useState({});
  const [selectedOption, setSelectedOption] = useState(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [isAllFinished, setIsAllFinished] = useState(false);

  // State đóng/mở Gợi ý và Từ vựng
  const [showHint, setShowHint] = useState(false);
  const [showVocab, setShowVocab] = useState(false);

  // Danh sách các câu làm sai (chỉ ghi nhận lần đầu tiên _firstTry)
  const [wrongQuestions, setWrongQuestions] = useState([]);

  const totalOriginalQuestions = useMemo(() => {
    return sections.reduce((acc, sec) => acc + (sec.questions?.length || 0), 0);
  }, [sections]);

  const loadSection = (idx) => {
    const sec = sections[idx];
    if (!sec || !sec.questions?.length) return;
    const config = sec.config || {};
    let rawList = sec.questions.map((q) => {
      let opts = q.options ? [...q.options] : [];
      opts = shuffleArray(opts);
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
    setShowHint(false);
    setShowVocab(false);
  };

  useEffect(() => {
    loadSection(activeSectionIdx);
  }, [activeSectionIdx]);

  const currentQuestion = questionsQueue[0];
  const currentSection = sections[activeSectionIdx];

  // Tự động đóng hint & vocab mỗi khi câu hỏi thay đổi
  useEffect(() => {
    setShowHint(false);
    setShowVocab(false);
  }, [currentQuestion?.question_id, currentQuestion?.prompt]);

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

    if (!isCorrect && currentQuestion._firstTry) {
      const chosenOpt = currentQuestion.options?.find((o) => o.id === optId);
      const rightOpt = currentQuestion.options?.find(
        (o) => o.id === currentQuestion.correct_option_id
      );
      setWrongQuestions((prev) => {
        const exists = prev.some(
          (item) => item.questionId === (currentQuestion.question_id || currentQuestion.prompt)
        );
        if (exists) return prev;
        return [
          ...prev,
          {
            questionId: currentQuestion.question_id || currentQuestion.prompt,
            prompt: currentQuestion.prompt,
            chosenOptId: optId,
            chosenOptText: chosenOpt?.text || '',
            correctOptId: currentQuestion.correct_option_id,
            correctOptText: rightOpt?.text || '',
            explanation: currentQuestion.explanation,
          },
        ];
      });
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
        options: shuffleArray(finishedQ.options || []),
      });
    }

    setQuestionsQueue(nextQueue);
    setSelectedOption(null);
    setIsAnswered(false);
    setShowHint(false);
    setShowVocab(false);

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
    const finalScore =
      totalOriginalQuestions > 0
        ? Math.round((totalCorrect / totalOriginalQuestions) * 100)
        : 100;

    return (
      <div className="w-full flex flex-col items-center">
        <SessionResult
          score={finalScore}
          practiceId={quizId}
          practiceType="Quiz"
          practiceName={quizTitle}
          backText="Quay lại"
          restartText="Luyện lại"
          resultMessage={`Đúng ${totalCorrect}/${totalOriginalQuestions} câu trên toàn bộ bài.`}
          onBack={onHome}
          onRestart={() => {
            setIsAllFinished(false);
            setSectionScores({});
            setWrongQuestions([]);
            setActiveSectionIdx(0);
            loadSection(0);
          }}
        />

        {wrongQuestions.length > 0 && (
          <div className="w-full max-w-4xl px-4 py-8 mb-12 flex flex-col gap-5">
            <div className="flex items-center gap-2 text-rose-400 border-b border-rose-950/80 pb-3">
              <AlertCircle size={22} />
              <h3 className="text-xl font-bold text-white m-0">
                Danh sách câu làm sai ({wrongQuestions.length} câu)
              </h3>
            </div>
            <div className="flex flex-col gap-4">
              {wrongQuestions.map((item, index) => (
                <div
                  key={index}
                  className="bg-[#05081f] border border-rose-950/70 p-5 rounded-xl shadow-lg flex flex-col gap-3.5"
                >
                  <div className="text-slate-100 font-medium text-base whitespace-pre-wrap leading-relaxed">
                    <span className="font-mono text-rose-400 font-bold mr-2">
                      #{index + 1}.
                    </span>
                    {renderTextWithNewlines(item.prompt)}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-800/80 text-sm">
                    <div className="p-3 bg-[#3b0f1d]/50 border border-rose-500/40 rounded-lg flex flex-col gap-1">
                      <span className="text-rose-400 font-semibold text-xs uppercase flex items-center gap-1.5">
                        <XCircle size={14} /> Bạn chọn
                      </span>
                      <div className="text-slate-200 whitespace-pre-wrap">
                        {renderTextWithNewlines(item.chosenOptText)}
                      </div>
                    </div>
                    <div className="p-3 bg-[#063024]/50 border border-emerald-500/40 rounded-lg flex flex-col gap-1">
                      <span className="text-emerald-400 font-semibold text-xs uppercase flex items-center gap-1.5">
                        <CheckCircle size={14} /> Đáp án chính xác
                      </span>
                      <div className="text-slate-200 whitespace-pre-wrap">
                        {renderTextWithNewlines(item.correctOptText)}
                      </div>
                    </div>
                  </div>
                  {item.explanation && (
                    <div className="mt-1 p-3 bg-[#0a133d] border border-cyan-500/30 text-cyan-200 text-xs rounded-lg flex gap-2.5 items-start">
                      <Brain size={16} className="text-cyan-400 shrink-0 mt-0.5" />
                      <div className="leading-relaxed text-slate-300 whitespace-pre-wrap">
                        <span className="font-bold text-cyan-300 uppercase mr-1">
                          Giải thích:
                        </span>
                        {renderTextWithNewlines(item.explanation)}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  if (!currentQuestion) return null;

  const hasHint = Boolean(currentQuestion.hint);
  const hasVocab = Boolean(
    (Array.isArray(currentQuestion.vocabulary) && currentQuestion.vocabulary.length > 0) ||
    (typeof currentQuestion.vocabulary === 'string' && currentQuestion.vocabulary.trim())
  );

  return (
    <div className="w-full flex flex-col gap-6">
      {/* Section navigation tabs */}
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

      {/* Main card area */}
      <div className="w-full bg-[#05081f] border-y sm:border border-fuchsia-950/70 p-5 sm:p-8 flex flex-col gap-6 rounded-none shadow-xl">
        {/* Question Content */}
        <div className="w-full p-5 sm:p-6 bg-[#090f33] border border-cyan-950/60 rounded-none flex flex-col gap-4">
          <div className="text-slate-100 font-semibold text-base sm:text-xl leading-relaxed whitespace-pre-wrap">
            {!currentQuestion._firstTry && (
              <span className="inline-block px-2.5 py-0.5 bg-amber-950/70 text-amber-300 border border-amber-500/40 text-xs uppercase font-mono mr-3">
                Làm lại câu sai
              </span>
            )}
            {renderTextWithNewlines(currentQuestion.prompt)}
          </div>

          {/* 2 Nút Gợi ý & Từ vựng */}
          {(hasHint || hasVocab) && (
            <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-cyan-950/60">
              {hasHint && (
                <button
                  type="button"
                  onClick={() => setShowHint((prev) => !prev)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold uppercase tracking-wider border transition-all ${
                    showHint
                      ? 'bg-amber-500/20 text-amber-300 border-amber-400 shadow-[0_0_8px_rgba(245,158,11,0.25)]'
                      : 'bg-[#060a24] text-amber-400/80 border-amber-500/30 hover:border-amber-400 hover:text-amber-300'
                  }`}
                >
                  <Lightbulb size={14} className={showHint ? 'fill-amber-400' : ''} />
                  <span>Gợi ý</span>
                </button>
              )}

              {hasVocab && (
                <button
                  type="button"
                  onClick={() => setShowVocab((prev) => !prev)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold uppercase tracking-wider border transition-all ${
                    showVocab
                      ? 'bg-teal-500/20 text-teal-300 border-teal-400 shadow-[0_0_8px_rgba(20,184,166,0.25)]'
                      : 'bg-[#060a24] text-teal-400/80 border-teal-500/30 hover:border-teal-400 hover:text-teal-300'
                  }`}
                >
                  <BookA size={14} />
                  <span>Từ vựng</span>
                </button>
              )}
            </div>
          )}

          {/* Khung hiển thị Gợi ý */}
          {showHint && hasHint && (
            <div className="p-3.5 bg-[#1f1906] border border-amber-500/50 rounded text-amber-200 text-sm flex items-start gap-2.5 animate-fadeIn">
              <Lightbulb size={16} className="text-amber-400 shrink-0 mt-0.5" />
              <div className="leading-relaxed whitespace-pre-wrap">
                <span className="font-bold text-amber-300 uppercase tracking-wider text-xs block mb-1">
                  Gợi ý giải bài:
                </span>
                {renderTextWithNewlines(currentQuestion.hint)}
              </div>
            </div>
          )}

          {/* Khung hiển thị Từ vựng */}
          {showVocab && hasVocab && (
            <div className="p-3.5 bg-[#041a18] border border-teal-500/50 rounded text-teal-100 text-sm flex items-start gap-2.5 animate-fadeIn">
              <BookA size={16} className="text-teal-400 shrink-0 mt-0.5" />
              <div className="flex-1 leading-relaxed">
                <span className="font-bold text-teal-300 uppercase tracking-wider text-xs block mb-1.5">
                  Từ vựng quan trọng:
                </span>
                {Array.isArray(currentQuestion.vocabulary) ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-1">
                    {currentQuestion.vocabulary.map((v, vIdx) => (
                      <div
                        key={vIdx}
                        className="px-2.5 py-1.5 bg-[#082a26] border border-teal-800/60 text-xs flex justify-between items-center"
                      >
                        <span className="font-bold text-teal-200">{v.word}</span>
                        <span className="text-slate-300">{v.meaning}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="whitespace-pre-wrap text-slate-200">
                    {renderTextWithNewlines(currentQuestion.vocabulary)}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Options */}
        <div className="flex flex-col gap-3">
          {currentQuestion.options?.map((opt) => {
            const isSelected = selectedOption === opt.id;
            const isCorrect = opt.id === currentQuestion.correct_option_id;
            let optionClass =
              'bg-[#090f33] border-slate-800 text-slate-200 hover:border-cyan-500/60 hover:bg-[#0c1547]';

            if (isAnswered) {
              if (isCorrect) {
                optionClass =
                  'bg-[#063024] border-emerald-500 text-emerald-300 font-bold shadow-[0_0_12px_rgba(16,185,129,0.2)]';
              } else if (isSelected && !isCorrect) {
                optionClass = 'bg-[#3b0f1d] border-rose-500 text-rose-300';
              } else {
                optionClass = 'bg-[#090f33] border-slate-800 text-slate-300';
              }
            }

            return (
              <button
                key={opt.id}
                disabled={isAnswered}
                onClick={() => handleSelectOption(opt.id)}
                className={`w-full min-h-[52px] p-4 text-left rounded-none border transition-all flex justify-between items-center text-sm sm:text-base leading-snug ${optionClass}`}
              >
                <span className="flex-1 pr-3 whitespace-pre-wrap">
                  {renderTextWithNewlines(opt.text)}
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

        {/* Explanation */}
        {isAnswered && currentQuestion.explanation && (
          <div className="w-full p-4 bg-[#0a133d] border border-cyan-500/40 text-cyan-200 text-sm flex gap-3 items-start">
            <Brain size={20} className="text-cyan-400 shrink-0 mt-0.5" />
            <div className="flex-1">
              <div className="font-bold uppercase tracking-wider text-xs mb-1 text-cyan-300">
                Giải thích chi tiết
              </div>
              <div className="leading-relaxed text-slate-300 whitespace-pre-wrap">
                {renderTextWithNewlines(currentQuestion.explanation)}
              </div>
            </div>
          </div>
        )}

        {/* Next Button */}
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