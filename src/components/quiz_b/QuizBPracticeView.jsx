// src/components/quiz_b/QuizBPracticeView.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { CheckCircle, XCircle, ArrowRight, Brain, AlertCircle } from 'lucide-react';
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

  // Danh sách các câu làm sai (chỉ ghi nhận ở lần đầu tiên _firstTry)
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

    // Ghi nhận câu sai lần đầu vào danh sách tổng kết cuối bài
    if (!isCorrect && currentQuestion._firstTry) {
      const chosenOpt = currentQuestion.options?.find((o) => o.id === optId);
      const rightOpt = currentQuestion.options?.find(
        (o) => o.id === currentQuestion.correct_option_id
      );

      setWrongQuestions((prev) => {
        // Tránh trùng lặp nếu câu hỏi đã tồn tại
        const exists = prev.some((item) => item.questionId === (currentQuestion.id || currentQuestion.prompt));
        if (exists) return prev;

        return [
          ...prev,
          {
            questionId: currentQuestion.id || currentQuestion.prompt,
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

        {/* Danh sách chi tiết các câu làm sai */}
        {wrongQuestions.length > 0 && (
          <div className="w-full max-w-4xl px-4 py-8 mb-12 flex flex-col gap-5">
            <div className="flex items-center gap-2 text-rose-400 border-b border-rose-950/80 pb-3">
              <AlertCircle size={22} />
              <h3 className="text-xl font-bold text-white m-0">
                Làm sai {wrongQuestions.length} câu
              </h3>
            </div>

            <div className="flex flex-col gap-4">
              {wrongQuestions.map((item, index) => (
                <div
                  key={index}
                  className="bg-[#05081f] border border-rose-950/70 p-5 rounded-xl shadow-lg flex flex-col gap-3.5"
                >
                  {/* Nội dung câu hỏi */}
                  <div className="text-slate-100 font-medium text-base whitespace-pre-wrap leading-relaxed">
                    <span className="font-mono text-rose-400 font-bold mr-2">
                      #{index + 1}.
                    </span>
                    {renderTextWithNewlines(item.prompt)}
                  </div>

                  {/* Chi tiết đáp án học sinh chọn & đáp án chuẩn */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-800/80 text-sm">
                    {/* Đáp án đã chọn */}
                    <div className="p-3 bg-[#3b0f1d]/50 border border-rose-500/40 rounded-lg flex flex-col gap-1">
                      <span className="text-rose-400 font-semibold text-xs uppercase flex items-center gap-1.5">
                        <XCircle size={14} /> Đáp án bạn đã chọn:
                      </span>
                      <div className="text-slate-200 whitespace-pre-wrap">
                        <strong className="font-mono mr-1 text-rose-300">
                          {item.chosenOptId}.
                        </strong>
                        {renderTextWithNewlines(item.chosenOptText)}
                      </div>
                    </div>

                    {/* Đáp án đúng */}
                    <div className="p-3 bg-[#063024]/50 border border-emerald-500/40 rounded-lg flex flex-col gap-1">
                      <span className="text-emerald-400 font-semibold text-xs uppercase flex items-center gap-1.5">
                        <CheckCircle size={14} /> Đáp án chính xác:
                      </span>
                      <div className="text-slate-200 whitespace-pre-wrap">
                        <strong className="font-mono mr-1 text-emerald-300">
                          {item.correctOptId}.
                        </strong>
                        {renderTextWithNewlines(item.correctOptText)}
                      </div>
                    </div>
                  </div>

                  {/* Giải thích nếu có */}
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
        <div className="w-full p-5 sm:p-6 bg-[#090f33] border border-cyan-950/60 rounded-none">
          <div className="text-slate-100 font-semibold text-base sm:text-xl leading-relaxed whitespace-pre-wrap">
            {!currentQuestion._firstTry && (
              <span className="inline-block px-2.5 py-0.5 bg-amber-950/70 text-amber-300 border border-amber-500/40 text-xs uppercase font-mono mr-3">
                Lặp lại câu sai
              </span>
            )}
            {renderTextWithNewlines(currentQuestion.prompt)}
          </div>
        </div>

        {/* Options */}
        <div className="flex flex-col gap-3">
          {currentQuestion.options?.map((opt) => {
            const isSelected = selectedOption === opt.id;
            const isCorrect = opt.id === currentQuestion.correct_option_id;

            // Mặc định: nền xanh navy và text sáng rõ ràng
            let optionClass =
              'bg-[#090f33] border-slate-800 text-slate-200 hover:border-cyan-500/60 hover:bg-[#0c1547]';

            if (isAnswered) {
              if (isCorrect) {
                // Đáp án đúng: Viền & nền xanh lá nổi bật
                optionClass =
                  'bg-[#063024] border-emerald-500 text-emerald-300 font-bold shadow-[0_0_12px_rgba(16,185,129,0.2)]';
              } else if (isSelected && !isCorrect) {
                // Đáp án chọn sai: Viền & nền đỏ cảnh báo
                optionClass = 'bg-[#3b0f1d] border-rose-500 text-rose-300';
              } else {
                // Các đáp án khác KHÔNG bị làm tối, giữ độ hiển thị bình thường để học sinh dễ so sánh
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
                  <strong className="mr-2 text-slate-400 font-mono">{opt.id}.</strong>
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