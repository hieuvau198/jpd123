// src/components/quiz_b/QuizBTheoryView.jsx
import React, { useState } from 'react';
import { Card, Typography, Button, Table, Alert, Flex } from 'antd';
import { CheckCircle, XCircle, ArrowRight, HelpCircle, Sparkles } from 'lucide-react';

const { Title, Text, Paragraph } = Typography;

// Bảng màu pastel nhẹ, thanh lịch cho các block kế tiếp
const BLOCK_THEMES = [
  'bg-slate-50/70 border-slate-200/50 hover:border-slate-300/60',
  'bg-indigo-50/30 border-indigo-100/70 hover:border-indigo-200/60',
  'bg-emerald-50/30 border-emerald-100/70 hover:border-emerald-200/60',
  'bg-amber-50/30 border-amber-100/70 hover:border-amber-200/60',
  'bg-sky-50/30 border-sky-100/70 hover:border-sky-200/60',
];

const QuizBTheoryView = ({ sections = [], onGoToPractice }) => {
  const [activeSectionIdx, setActiveSectionIdx] = useState(0);
  const [quickAnswers, setQuickAnswers] = useState({});

  if (!sections.length) {
    return (
      <div className="text-center py-16 bg-white/70 backdrop-blur-md rounded-3xl border border-dashed border-slate-200 text-slate-400">
        Chưa có nội dung lý thuyết.
      </div>
    );
  }

  const currentSection = sections[activeSectionIdx] || sections[0];

  // Lọc tách riêng Quick Quiz ra khỏi khối lý thuyết nội dung chính
  const mainBlocks = (currentSection.blocks || []).filter((b) => b.type !== 'quick_quiz');
  const quickQuizBlocks = (currentSection.blocks || []).filter((b) => b.type === 'quick_quiz');

  const handleSelectQuickOption = (qId, optId) => {
    setQuickAnswers((prev) => ({ ...prev, [qId]: optId }));
  };

  const renderBlockContent = (block, bIdx) => {
    switch (block.type) {
      case 'text':
        return (
          <div key={bIdx} style={{ textAlign: block.align || 'left' }}>
            {block.spans?.map((span, sIdx) => (
              <span
                key={sIdx}
                style={{
                  fontWeight: span.bold ? 600 : 400,
                  color: span.color || '#1e293b',
                  fontSize: block.size === 'lg' ? '1.18rem' : block.size === 'sm' ? '0.92rem' : '1.02rem',
                  lineHeight: 1.75,
                }}
              >
                {span.text}
              </span>
            ))}
          </div>
        );

      case 'image':
        return (
          <div key={bIdx} className="my-3 text-center">
            <img
              src={block.url}
              alt={block.alt || 'Theory visual'}
              className="rounded-2xl max-h-80 mx-auto object-contain shadow-sm border border-slate-100"
            />
            {block.caption && (
              <Text type="secondary" className="block mt-2.5 text-xs italic text-slate-500 font-medium">
                {block.caption}
              </Text>
            )}
          </div>
        );

      case 'table': {
        const rawCols = block.columns || (Array.isArray(block.headers?.[0]) ? block.headers[0] : block.headers) || [];
        const rawRows = block.rows || [];

        const columns = rawCols.map((col, cIdx) => ({
          title: (
            <span className="font-semibold text-slate-700 tracking-wide text-xs uppercase" style={{ color: col.color || 'inherit' }}>
              {col.text}
            </span>
          ),
          dataIndex: `col_${cIdx}`,
          key: col.key || `col_${cIdx}`,
          align: col.align || 'left',
          render: (cell) => (
            <span
              className="text-sm sm:text-base leading-relaxed"
              style={{ fontWeight: cell?.bold ? 600 : 400, color: cell?.color || '#334155' }}
            >
              {cell?.text || cell || ''}
            </span>
          ),
        }));

        const dataSource = rawRows.map((rowItem, rIdx) => {
          const rowObj = { key: rowItem.row_id || rIdx };
          const cells = Array.isArray(rowItem.cells) ? rowItem.cells : (Array.isArray(rowItem) ? rowItem : []);
          cells.forEach((cell, cIdx) => {
            rowObj[`col_${cIdx}`] = cell;
          });
          return rowObj;
        });

        return (
          <div key={bIdx} className="my-2 overflow-x-auto rounded-xl border border-slate-100">
            {/* Hiển thị tự nhiên toàn bộ chiều dài, tuyệt đối không scroll dọc */}
            <Table
              bordered={false}
              size="middle"
              pagination={false}
              columns={columns}
              dataSource={dataSource}
              className="[&_.ant-table]:!bg-transparent [&_.ant-table-thead_th]:!bg-slate-100/60 [&_.ant-table-tbody_td]:!border-b [&_.ant-table-tbody_td]:!border-slate-100"
            />
          </div>
        );
      }

      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col gap-5">
      {/* Mục lục chỉ hiển thị số: 1, 2, 3... kiểu Minimal Circle Chips */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none border-b border-slate-200/50">
        {sections.map((sec, idx) => (
          <button
            key={sec.section_id || idx}
            onClick={() => setActiveSectionIdx(idx)}
            className={`w-10 h-10 rounded-2xl text-sm font-semibold flex items-center justify-center transition-all duration-200 flex-shrink-0 ${
              activeSectionIdx === idx
                ? 'bg-slate-900 text-white shadow-md shadow-slate-900/20 scale-105'
                : 'bg-white/80 text-slate-500 hover:bg-white hover:text-slate-900 border border-slate-200/60'
            }`}
          >
            {idx + 1}
          </button>
        ))}
      </div>

      {/* CARD 1: KHỐI NỘI DUNG LÝ THUYẾT CHÍNH */}
      <div className="bg-white/95 backdrop-blur-md rounded-3xl p-5 sm:p-7 shadow-[0_10px_30px_rgb(0,0,0,0.03)] border border-slate-100 flex flex-col gap-4">
        {/* Số thứ tự block lớn tối giản */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2.5">
            <span className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 font-bold text-sm flex items-center justify-center">
              #{activeSectionIdx + 1}
            </span>
            <span className="text-slate-400 text-sm font-medium">Chuyên mục lý thuyết</span>
          </div>
        </div>

        {/* Nội dung các block với màu sắc luân phiên chống nhàm chán */}
        <div className="flex flex-col gap-4 mt-1">
          {mainBlocks.map((blk, idx) => {
            const themeClass = BLOCK_THEMES[idx % BLOCK_THEMES.length];
            return (
              <div
                key={idx}
                className={`p-4 sm:p-5 rounded-2xl border transition-all duration-200 ${themeClass}`}
              >
                {renderBlockContent(blk, idx)}
              </div>
            );
          })}
        </div>

        {/* Nút Điều hướng trang lý thuyết */}
        <Flex justify="space-between" align="center" className="mt-4 pt-4 border-t border-slate-100">
          <Button
            disabled={activeSectionIdx === 0}
            onClick={() => setActiveSectionIdx((prev) => prev - 1)}
            className="rounded-xl h-10 px-5 font-medium border-slate-200 hover:border-slate-400"
          >
            Trước
          </Button>

          {activeSectionIdx < sections.length - 1 ? (
            <Button
              type="primary"
              onClick={() => setActiveSectionIdx((prev) => prev + 1)}
              className="rounded-xl h-10 px-6 bg-blue-600 hover:bg-blue-500 font-medium border-none shadow-sm shadow-blue-500/20"
            >
              Kế tiếp
            </Button>
          ) : (
            <Button
              type="primary"
              onClick={onGoToPractice}
              icon={<ArrowRight size={16} />}
              className="rounded-xl h-10 px-6 bg-slate-900 hover:bg-slate-800 font-semibold border-none shadow-sm text-white flex items-center gap-1.5"
            >
              Bắt đầu Luyện tập
            </Button>
          )}
        </Flex>
      </div>

      {/* CARD 2: PHÂN TÁCH RIÊNG CÂU HỎI TƯƠNG TÁC (QUICK QUIZ) Ở DƯỚI */}
      {quickQuizBlocks.length > 0 && (
        <div className="flex flex-col gap-4 mt-2">
          {quickQuizBlocks.map((block, bIdx) => {
            const selectedOpt = quickAnswers[block.question_id];
            const isAnswered = Boolean(selectedOpt);
            const isCorrect = selectedOpt === block.correct_option_id;

            return (
              <Card
                key={bIdx}
                className="rounded-3xl shadow-[0_10px_30px_rgb(245,158,11,0.06)] border border-amber-200/80 bg-gradient-to-br from-amber-50/60 via-white to-amber-50/20 overflow-hidden"
                styles={{ body: { padding: '20px 24px' } }}
              >
                <div className="flex items-center gap-2 text-amber-700 font-semibold text-xs tracking-wider uppercase mb-3">
                  <Sparkles size={16} className="text-amber-500" />
                  <span>Câu hỏi tương tác củng cố</span>
                </div>

                <Paragraph className="!text-slate-800 font-medium !text-base sm:!text-lg leading-snug mb-5">
                  {block.prompt}
                </Paragraph>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {block.options?.map((opt) => {
                    const isSelected = selectedOpt === opt.id;
                    const isRightOpt = opt.id === block.correct_option_id;

                    let btnClass = 'border-slate-200/80 bg-white/90 text-slate-700 hover:border-amber-300';
                    if (isAnswered) {
                      if (isRightOpt) {
                        btnClass = 'border-emerald-500 bg-emerald-50 text-emerald-800 font-semibold shadow-xs';
                      } else if (isSelected && !isRightOpt) {
                        btnClass = 'border-red-400 bg-red-50 text-red-700';
                      } else {
                        btnClass = 'opacity-40 bg-white text-slate-400 border-slate-200';
                      }
                    }

                    return (
                      <button
                        key={opt.id}
                        disabled={isAnswered}
                        onClick={() => handleSelectQuickOption(block.question_id, opt.id)}
                        className={`w-full p-3.5 px-4 text-left rounded-2xl border-2 transition-all duration-200 flex justify-between items-center text-sm sm:text-base ${btnClass}`}
                      >
                        <span className="leading-snug">
                          <strong className="mr-2 opacity-75">{opt.id}.</strong>
                          {opt.text}
                        </span>
                        {isAnswered && isRightOpt && <CheckCircle size={18} className="text-emerald-600 shrink-0" />}
                        {isAnswered && isSelected && !isRightOpt && <XCircle size={18} className="text-red-500 shrink-0" />}
                      </button>
                    );
                  })}
                </div>

                {isAnswered && block.explanation && (
                  <Alert
                    type={isCorrect ? 'success' : 'info'}
                    showIcon
                    className="mt-5 rounded-2xl border border-slate-200/70"
                    message={<span className="font-semibold">{isCorrect ? 'Chính xác!' : 'Giải thích'}</span>}
                    description={<span className="text-slate-600">{block.explanation}</span>}
                  />
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default QuizBTheoryView;