// src/components/reading/sections/SentenceOrderingSection.jsx
import React from 'react';
import { Button, Typography } from 'antd';
import { ArrowUp, ArrowDown, CheckCircle2, XCircle } from 'lucide-react';
import InteractiveText from '../InteractiveText';

const { Paragraph } = Typography;

const SentenceOrderingSection = ({ section, value, onChange, submitted, glossary }) => {
  const currentOrder = value || (section.scrambled_items || []).map(item => item.id);
  const itemMap = (section.scrambled_items || []).reduce((acc, item) => {
    acc[item.id] = item;
    return acc;
  }, {});

  const isOrderCorrect = JSON.stringify(currentOrder) === JSON.stringify(section.correct_order);

  const moveOrderItem = (index, direction) => {
    if (submitted) return;
    const currentList = [...currentOrder];
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= currentList.length) return;

    const temp = currentList[index];
    currentList[index] = currentList[targetIndex];
    currentList[targetIndex] = temp;

    onChange(currentList);
  };

  return (
    <div className="flex flex-col gap-4">
      {section.instructions && (
        <Paragraph className="text-gray-600 font-medium">{section.instructions}</Paragraph>
      )}

      <div className="flex flex-col gap-3">
        {currentOrder.map((itemId, idx) => {
          const item = itemMap[itemId];
          if (!item) return null;

          return (
            <div
              key={itemId}
              className="flex items-center gap-3 p-4 bg-slate-50 border border-slate-200 rounded-xl transition-all"
            >
              <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-sm shrink-0">
                {idx + 1}
              </div>
              <div className="flex-1 text-slate-800 text-base">
                <InteractiveText text={item.text} glossary={glossary} />
              </div>
              {!submitted && (
                <div className="flex flex-col gap-1">
                  <Button
                    size="small"
                    icon={<ArrowUp size={14} />}
                    disabled={idx === 0}
                    onClick={() => moveOrderItem(idx, -1)}
                  />
                  <Button
                    size="small"
                    icon={<ArrowDown size={14} />}
                    disabled={idx === currentOrder.length - 1}
                    onClick={() => moveOrderItem(idx, 1)}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {submitted && (
        <div className="mt-4 p-4 rounded-xl border border-slate-200 bg-slate-50">
          <div className="flex items-center gap-2 mb-2 font-bold">
            {isOrderCorrect ? (
              <span className="text-emerald-600 flex items-center gap-1">
                <CheckCircle2 size={18} /> Thứ tự chính xác!
              </span>
            ) : (
              <span className="text-rose-600 flex items-center gap-1">
                <XCircle size={18} /> Thứ tự chưa chính xác!
              </span>
            )}
          </div>
          {!isOrderCorrect && (
            <div className="text-sm text-slate-700 mb-2">
              <strong>Thứ tự đúng: </strong>
              {section.correct_order?.map((id, i) => (
                <span key={id} className="font-mono font-bold text-blue-600 mr-2">
                  {i + 1}. ({itemMap[id]?.text?.slice(0, 30)}...)
                </span>
              ))}
            </div>
          )}
          {section.explanation && (
            <p className="text-xs text-slate-500 italic mt-1">
              <strong>Giải thích:</strong> {section.explanation}
            </p>
          )}
        </div>
      )}
    </div>
  );
};

// Hàm phụ trợ tính điểm của section này
SentenceOrderingSection.calculateScore = (section, userAnswers = {}) => {
  const currentOrder = userAnswers[section.id] || (section.scrambled_items || []).map(i => i.id);
  const isMatch = JSON.stringify(currentOrder) === JSON.stringify(section.correct_order);
  return { total: 1, correct: isMatch ? 1 : 0 };
};

export default SentenceOrderingSection;