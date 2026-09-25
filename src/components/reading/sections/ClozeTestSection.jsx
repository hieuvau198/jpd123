// src/components/reading/sections/ClozeTestSection.jsx
import React from 'react';
import { Card } from 'antd';
import InteractiveText from '../InteractiveText';

const ClozeTestSection = ({ section, value = {}, onChange, submitted, glossary }) => {
  const handleSelectBlank = (blankId, optKey) => {
    if (submitted) return;
    onChange({ ...value, [blankId]: optKey });
  };

  const renderPassageWithBlanks = () => {
    const template = section.passage_template || '';
    const parts = template.split(/(\[blank_\d+\])/g);

    return parts.map((part, pIdx) => {
      const match = part.match(/\[(blank_\d+)\]/);
      if (match) {
        const blankId = match[1];
        const chosenKey = value[blankId];
        const blankInfo = (section.blanks || []).find(b => b.blank_id === blankId);
        const chosenOpt = blankInfo?.options?.find(o => o.key === chosenKey);

        let badgeStyle = "bg-blue-100 text-blue-800 border-blue-300";
        if (submitted) {
          const isRight = chosenKey === blankInfo?.correct_answer;
          badgeStyle = isRight
            ? "bg-emerald-100 text-emerald-800 border-emerald-400 font-bold"
            : "bg-rose-100 text-rose-800 border-rose-400 font-bold";
        }

        return (
          <span
            key={pIdx}
            className={`inline-block px-2.5 py-0.5 mx-1 border rounded-md font-mono text-sm underline decoration-dotted ${badgeStyle}`}
          >
            {chosenOpt ? chosenOpt.text : `(${blankId})`}
          </span>
        );
      }
      return <InteractiveText key={pIdx} text={part} glossary={glossary} />;
    });
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="p-6 bg-slate-50 border border-slate-200 rounded-2xl text-slate-800 text-lg leading-relaxed text-justify">
        {renderPassageWithBlanks()}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {(section.blanks || []).map((blank) => {
          const chosen = value[blank.blank_id];
          const isCorrect = chosen === blank.correct_answer;

          return (
            <Card key={blank.blank_id} className="rounded-xl border border-slate-200">
              <div className="font-bold text-sm text-slate-700 mb-2">
                Vị trí [{blank.blank_id}]:
              </div>
              <div className="grid grid-cols-2 gap-2">
                {blank.options?.map(opt => {
                  const isSelected = chosen === opt.key;
                  let btnStyle = "border-slate-200 bg-white text-slate-700 hover:border-blue-400";

                  if (submitted) {
                    if (opt.key === blank.correct_answer) {
                      btnStyle = "border-emerald-500 bg-emerald-50 text-emerald-800 font-semibold";
                    } else if (isSelected && !isCorrect) {
                      btnStyle = "border-rose-500 bg-rose-50 text-rose-800";
                    } else {
                      btnStyle = "border-slate-100 bg-slate-50 text-slate-400";
                    }
                  } else if (isSelected) {
                    btnStyle = "border-blue-500 bg-blue-50 text-blue-700 font-semibold";
                  }

                  return (
                    <button
                      key={opt.key}
                      type="button"
                      disabled={submitted}
                      onClick={() => handleSelectBlank(blank.blank_id, opt.key)}
                      className={`p-2.5 rounded-lg border text-sm text-center font-medium transition-all ${btnStyle}`}
                    >
                      {opt.key}. {opt.text}
                    </button>
                  );
                })}
              </div>

              {submitted && blank.explanation && (
                <div className="mt-2 text-xs text-slate-500">
                  <strong>Giải thích:</strong> {blank.explanation}
                </div>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
};

ClozeTestSection.calculateScore = (section, userAnswers = {}) => {
  const currentAnswers = userAnswers[section.id] || {};
  let correct = 0;
  const blanks = section.blanks || [];
  blanks.forEach(b => {
    if (currentAnswers[b.blank_id] === b.correct_answer) correct += 1;
  });
  return { total: blanks.length, correct };
};

export default ClozeTestSection;