// src/components/repair/RepairWorkspace.jsx
import React from 'react';
import { Card, Button, Typography, Tooltip } from 'antd';
import { RotateCcw, ArrowRight, Lightbulb } from 'lucide-react';

const { Text } = Typography;

const RepairWorkspace = ({
  currentIndex,
  totalQuestions,
  currentQuestion,
  availableTokens,
  selectedTokens,
  isChecked,
  isCorrect,
  highlightedTokenId,
  hintCount = 0,
  maxHintsAllowed = 0,
  onSelectWord,
  onRemoveWord,
  onResetWords,
  onHelpMe,
  onCheckAnswer,
  onNextQuestion,
  onFinishSession,
}) => {
  const isHintLimitReached = hintCount >= maxHintsAllowed;

  return (
    <Card
      className="shadow-lg rounded-3xl border-0 overflow-hidden relative bg-white/95 backdrop-blur-sm min-h-[520px] flex flex-col"
      styles={{ body: { padding: '2rem', flex: 1, display: 'flex', flexDirection: 'column' } }}
    >
      {/* Header câu hỏi & Nút Gợi ý màu vàng */}
      <div className="flex justify-between items-center mb-4">
        <Text className="text-slate-400 font-semibold text-base">
          Câu {currentIndex + 1} / {totalQuestions}
        </Text>
        <div className="flex items-center gap-2">
          {!isChecked && (
            <Tooltip
              title={
                isHintLimitReached
                  ? 'Đã đạt giới hạn gợi ý tối đa 50% số từ của câu'
                  : `Đã dùng ${hintCount}/${maxHintsAllowed} lần gợi ý`
              }
            >
              <Button
                type="default"
                size="middle"
                disabled={isHintLimitReached}
                icon={
                  <Lightbulb
                    size={16}
                    className={
                      isHintLimitReached
                        ? 'text-gray-400'
                        : 'text-yellow-600 fill-yellow-400'
                    }
                  />
                }
                onClick={onHelpMe}
                className={`flex items-center gap-1.5 font-bold rounded-xl transition-all shadow-sm ${
                  isHintLimitReached
                    ? 'border-gray-200 text-gray-400 bg-gray-100 cursor-not-allowed shadow-none'
                    : 'bg-yellow-400 hover:!bg-yellow-300 text-yellow-950 border-yellow-500 hover:!border-yellow-400 active:scale-95 shadow-yellow-200'
                }`}
              >
                Help me ({hintCount}/{maxHintsAllowed})
              </Button>
            </Tooltip>
          )}
          {isChecked && (
            <span
              className={`px-3 py-1 rounded-full text-sm font-bold ${
                isCorrect ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
              }`}
            >
              {isCorrect ? 'Chính xác' : 'Chưa chính xác'}
            </span>
          )}
        </div>
      </div>

      {/* Nghĩa Tiếng Việt */}
      {currentQuestion.meaning && (
        <div className="mb-6 p-4 rounded-2xl bg-indigo-50/70 border border-indigo-100 text-center">
          <span className="text-xs uppercase font-bold text-indigo-500 tracking-wider block mb-1">
            Nghĩa
          </span>
          <span className="text-lg font-medium text-slate-800">
            {currentQuestion.meaning}
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
              onClick={onResetWords}
              className="text-xs text-indigo-600 hover:text-indigo-800 flex items-center gap-1 font-semibold"
            >
              <RotateCcw size={12} /> Làm lại câu này
            </button>
          )}
        </div>
        <div
          className={`min-h-[90px] p-4 rounded-2xl flex flex-wrap gap-2.5 items-center border-2 transition-all ${
            isChecked
              ? isCorrect
                ? 'bg-emerald-50/50 border-emerald-400'
                : 'bg-rose-50/50 border-rose-400'
              : 'bg-slate-50 border-dashed border-slate-300'
          }`}
        >
          {selectedTokens.length === 0 ? (
            <span className="text-slate-400 text-sm italic mx-auto">
              Bấm từ bên dưới để ghép câu
            </span>
          ) : (
            selectedTokens.map((token) => (
              <button
                key={token.id}
                type="button"
                disabled={isChecked}
                onClick={() => onRemoveWord(token)}
                className={`px-4 py-2 rounded-xl font-bold text-base transition-all transform active:scale-95 shadow-sm border ${
                  isChecked
                    ? isCorrect
                      ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                      : 'bg-rose-100 text-rose-800 border-rose-300'
                    : 'bg-indigo-600 text-white border-indigo-600 hover:bg-rose-500 hover:border-rose-500 hover:text-white cursor-pointer'
                }`}
                title={!isChecked ? 'Bấm để trả về kho từ' : ''}
              >
                {token.word}
              </button>
            ))
          )}
        </div>
      </div>

      {/* KHUNG 2: KHO TỪ ĐỂ CHỌN */}
      <div className="flex flex-col gap-2 flex-grow">
        <Text className="text-xs font-bold text-slate-400 uppercase tracking-wider px-1">
          Kho từ vựng
        </Text>
        <div className="p-4 rounded-2xl bg-slate-100/70 border border-slate-200 min-h-[110px] flex flex-wrap gap-2.5 items-center content-start">
          {availableTokens.length === 0 ? (
            <span className="text-slate-400 text-sm italic mx-auto">
              Đã dùng hết từ
            </span>
          ) : (
            availableTokens.map((token) => {
              const isHinted = highlightedTokenId === token.id;
              return (
                <button
                  key={token.id}
                  type="button"
                  disabled={isChecked}
                  onClick={() => onSelectWord(token)}
                  className={`px-4 py-2.5 rounded-xl font-bold text-base transition-all transform hover:-translate-y-0.5 active:translate-y-0 border-2 border-b-4 ${
                    isHinted
                      ? 'bg-yellow-300 border-yellow-500 border-b-yellow-600 text-yellow-950 ring-4 ring-yellow-300/60 shadow-lg scale-105 animate-pulse'
                      : isChecked
                      ? 'opacity-40 cursor-not-allowed bg-white border-slate-200 text-slate-400'
                      : 'bg-white border-slate-200 border-b-slate-300 text-slate-700 hover:border-indigo-400 hover:text-indigo-600 shadow-sm cursor-pointer'
                  }`}
                >
                  {token.word}
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* THAO TÁC / KIỂM TRA */}
      <div className="mt-8 flex flex-col justify-end">
        {isChecked ? (
          <div className="flex flex-col items-center w-full">
            {!isCorrect && (
              <div className="mb-5 p-4 rounded-xl bg-rose-50 border border-rose-200 text-center w-full">
                <Text className="text-slate-500 block text-xs uppercase font-bold tracking-wider mb-1">
                  Đáp án chính xác
                </Text>
                <Text className="text-emerald-700 font-bold text-lg">
                  {currentQuestion.answer}
                </Text>
              </div>
            )}
            <div className="flex gap-4 w-full">
              {currentIndex === totalQuestions - 1 ? (
                <Button
                  type="primary"
                  size="large"
                  onClick={onFinishSession}
                  className="flex-1 h-12 text-base font-bold rounded-xl bg-slate-900 hover:bg-slate-800 text-white border-none shadow-md"
                >
                  Xem kết quả tổng kết
                </Button>
              ) : (
                <Button
                  type="primary"
                  size="large"
                  onClick={onNextQuestion}
                  className={`flex-1 h-12 text-base font-bold rounded-xl border-none shadow-md ${
                    isCorrect
                      ? 'bg-emerald-600 hover:bg-emerald-500'
                      : 'bg-slate-900 hover:bg-slate-800'
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
            onClick={onCheckAnswer}
            className="w-full h-12 bg-indigo-600 hover:bg-indigo-500 border-none rounded-xl text-base font-bold shadow-lg shadow-indigo-200"
          >
            Kiểm tra câu
          </Button>
        )}
      </div>
    </Card>
  );
};

export default RepairWorkspace;