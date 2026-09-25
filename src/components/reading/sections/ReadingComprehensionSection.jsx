// src/components/reading/sections/ReadingComprehensionSection.jsx
import React from 'react';
import { Card, Typography } from 'antd';
import { CheckCircle2, XCircle } from 'lucide-react';
import InteractiveText from '../InteractiveText';

const ReadingComprehensionSection = ({ section, value = {}, onChange, submitted, glossary }) => {
  const handleSelectOption = (qid, optKey) => {
    if (submitted) return;
    onChange({ ...value, [qid]: optKey });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
      {/* Passage Column */}
      <div className="bg-amber-50/50 p-6 rounded-2xl border border-amber-200/60 sticky top-4">
        <div className="text-xs uppercase tracking-wider text-amber-800 font-bold mb-3">
          Đoạn văn đọc hiểu (Bấm vào từ vựng để tra nghĩa)
        </div>
        <div className="text-slate-800 text-lg leading-relaxed text-justify">
          <InteractiveText text={section.passage} glossary={glossary} />
        </div>
      </div>

      {/* Questions Column */}
      <div className="flex flex-col gap-6">
        {(section.questions || []).map((q, qIdx) => {
          const selectedOpt = value[q.qid];
          const isCorrect = selectedOpt === q.correct_answer;

          return (
            <Card key={q.qid} className="rounded-xl border border-slate-200 shadow-sm">
              <div className="font-bold text-base text-slate-800 mb-3 flex gap-2">
                <span>{qIdx + 1}.</span>
                <span><InteractiveText text={q.question} glossary={glossary} /></span>
              </div>

              <div className="flex flex-col gap-2">
                {q.options?.map(opt => {
                  const isChoice = selectedOpt === opt.key;
                  let btnStyle = "border-slate-200 bg-white text-slate-700 hover:border-blue-400";

                  if (submitted) {
                    if (opt.key === q.correct_answer) {
                      btnStyle = "border-emerald-500 bg-emerald-50 text-emerald-800 font-semibold";
                    } else if (isChoice && !isCorrect) {
                      btnStyle = "border-rose-500 bg-rose-50 text-rose-800";
                    } else {
                      btnStyle = "border-slate-100 bg-slate-50 text-slate-400";
                    }
                  } else if (isChoice) {
                    btnStyle = "border-blue-500 bg-blue-50 text-blue-700 font-semibold";
                  }

                  return (
                    <button
                      key={opt.key}
                      type="button"
                      disabled={submitted}
                      onClick={() => handleSelectOption(q.qid, opt.key)}
                      className={`w-full p-3 rounded-xl border text-left flex justify-between items-center transition-all ${btnStyle}`}
                    >
                      <span>
                        <strong className="mr-2">{opt.key}.</strong>
                        <InteractiveText text={opt.text} glossary={glossary} />
                      </span>
                      {submitted && opt.key === q.correct_answer && (
                        <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                      )}
                      {submitted && isChoice && !isCorrect && (
                        <XCircle size={16} className="text-rose-600 shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>

              {submitted && q.explanation && (
                <div className="mt-3 p-3 bg-blue-50/60 rounded-lg text-xs text-blue-900 border border-blue-200/50">
                  <strong>Giải thích:</strong> {q.explanation}
                </div>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
};

ReadingComprehensionSection.calculateScore = (section, userAnswers = {}) => {
  const currentAnswers = userAnswers[section.id] || {};
  let correct = 0;
  const questions = section.questions || [];
  questions.forEach(q => {
    if (currentAnswers[q.qid] === q.correct_answer) correct += 1;
  });
  return { total: questions.length, correct };
};

export default ReadingComprehensionSection;