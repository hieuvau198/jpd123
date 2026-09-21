// src/components/quiz_b/QuizBTheoryView.jsx
import React, { useState } from 'react';
import { Table, Typography } from 'antd';
import { CheckCircle, XCircle, ArrowRight, Sparkles } from 'lucide-react';

const { Text, Paragraph } = Typography;

// Bảng màu Cyber-Navy dành cho các block liền tiếp
const BLOCK_THEMES = [
  'bg-[#080d2c] border-cyan-900/40 text-slate-200',
  'bg-[#0e163d] border-indigo-900/50 text-slate-200',
  'bg-[#121136] border-purple-900/40 text-slate-200',
  'bg-[#1a0f2b] border-fuchsia-950/60 text-slate-200',
  'bg-[#09152a] border-teal-950/60 text-slate-200',
];

// Helper nhận dạng cả '\n' thực tế lẫn chuỗi ký tự "\n" để xuống dòng
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

const QuizBTheoryView = ({ sections = [], onGoToPractice }) => {
  const [activeSectionIdx, setActiveSectionIdx] = useState(0);
  const [quickAnswers, setQuickAnswers] = useState({});

  if (!sections.length) {
    return (
      <div className="w-full text-center py-16 text-slate-500 border-y border-slate-800 bg-[#050921]">
        Chưa có nội dung lý thuyết
      </div>
    );
  }

  const currentSection = sections[activeSectionIdx] || sections[0];
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
                className="whitespace-pre-wrap"
                style={{
                  fontWeight: span.bold ? 700 : 400,
                  color: span.color || '#e2e8f0',
                  fontSize: block.size === 'lg' ? '1.18rem' : block.size === 'sm' ? '0.92rem' : '1.02rem',
                  lineHeight: 1.75,
                }}
              >
                {renderTextWithNewlines(span.text)}
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
              className="rounded-none max-h-80 mx-auto object-contain border border-slate-700"
            />
            {block.caption && (
              <span className="block mt-2.5 text-xs italic text-slate-400 font-medium whitespace-pre-wrap">
                {renderTextWithNewlines(block.caption)}
              </span>
            )}
          </div>
        );

      case 'table': {
        const rawCols = block.columns || (Array.isArray(block.headers?.[0]) ? block.headers[0] : block.headers) || [];
        const rawRows = block.rows || [];

        const columns = rawCols.map((col, cIdx) => ({
          title: (
            <span className="font-bold text-cyan tracking-wider text-xs uppercase whitespace-pre-wrap" style={{ color: col.color || 'inherit' }}>
              {renderTextWithNewlines(col.text)}
            </span>
          ),
          dataIndex: `col_${cIdx}`,
          key: col.key || `col_${cIdx}`,
          align: col.align || 'left',
          render: (cell) => (
            <span
              className="text-sm sm:text-base leading-relaxed whitespace-pre-wrap"
              style={{ fontWeight: cell?.bold ? 700 : 400, color: cell?.color || '#cbd5e1' }}
            >
              {renderTextWithNewlines(cell?.text || cell || '')}
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
          <div key={bIdx} className="my-2 w-full overflow-x-auto overflow-y-hidden border border-slate-800">
            <Table
              bordered
              size="middle"
              pagination={false}
              columns={columns}
              dataSource={dataSource}
              scroll={{ x: 'max-content' }}
              className="w-full rounded-none [&_.ant-table]:!bg-[#05081e] [&_.ant-table]:!rounded-none [&_.ant-table-body]:!overflow-y-hidden [&_.ant-table-content]:!overflow-y-hidden [&_.ant-table-thead_th]:!bg-[#0a1138] [&_.ant-table-thead_th]:!border-slate-800 [&_.ant-table-tbody_td]:!border-slate-800/70"
            />
          </div>
        );
      }

      default:
        return null;
    }
  };

  return (
    <div className="w-full flex flex-col gap-6">
      {/* Mục lục section tabs */}
      <div className="w-full flex items-center gap-1 overflow-x-auto px-4 pb-2 border-b border-slate-800 scrollbar-none">
        {sections.map((sec, idx) => (
          <button
            key={sec.section_id || idx}
            onClick={() => setActiveSectionIdx(idx)}
            className={`w-10 h-10 rounded-none text-sm font-bold flex items-center justify-center transition-all flex-shrink-0 border ${
              activeSectionIdx === idx
                ? 'bg-[#15235c] text-cyan-300 border-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.3)]'
                : 'bg-[#060a22] text-slate-400 border-slate-800 hover:border-slate-700 hover:text-slate-200'
            }`}
          >
            {idx + 1}
          </button>
        ))}
      </div>

      {/* Card Lý thuyết chính */}
      <div className="w-full bg-[#05081f] border-y sm:border border-cyan-950/70 p-5 sm:p-8 flex flex-col gap-5 rounded-none shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
          <div className="flex items-center gap-3">
            <span className="px-3 py-1 bg-cyan-950/70 text-cyan-300 font-mono font-bold text-sm border border-cyan-500/30">
              #{activeSectionIdx + 1}
            </span>
            <span className="text-slate-400 text-xs tracking-wider uppercase font-semibold">Nội dung kiến thức</span>
          </div>
        </div>

        {/* Các block nội dung */}
        <div className="flex flex-col gap-4">
          {mainBlocks.map((blk, idx) => {
            const theme = BLOCK_THEMES[idx % BLOCK_THEMES.length];
            return (
              <div key={idx} className={`w-full p-4 sm:p-6 border rounded-none ${theme}`}>
                {renderBlockContent(blk, idx)}
              </div>
            );
          })}
        </div>

        {/* Nút điều hướng */}
        <div className="flex justify-between items-center mt-4 pt-4 border-t border-slate-800">
          <button
            disabled={activeSectionIdx === 0}
            onClick={() => setActiveSectionIdx((prev) => prev - 1)}
            className="px-6 py-2.5 rounded-none border border-slate-700 bg-[#080d2c] text-slate-300 hover:border-slate-500 disabled:opacity-30 disabled:pointer-events-none text-sm font-semibold"
          >
            Trước
          </button>

          {activeSectionIdx < sections.length - 1 ? (
            <button
              onClick={() => setActiveSectionIdx((prev) => prev + 1)}
              className="px-6 py-2.5 rounded-none border border-cyan-500 bg-[#0e1c53] text-cyan-300 hover:bg-[#13266f] text-sm font-semibold shadow-[0_0_10px_rgba(6,182,212,0.2)]"
            >
              Kế tiếp
            </button>
          ) : (
            <button
              onClick={onGoToPractice}
              className="px-6 py-2.5 rounded-none border border-fuchsia-500 bg-[#341349] text-fuchsia-200 hover:bg-[#43195f] text-sm font-semibold flex items-center gap-2 shadow-[0_0_12px_rgba(217,70,239,0.25)]"
            >
              <span>Luyện tập</span>
              <ArrowRight size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Khối Quick Quiz */}
      {quickQuizBlocks.length > 0 && (
        <div className="w-full flex flex-col gap-4">
          {quickQuizBlocks.map((block, bIdx) => {
            const selectedOpt = quickAnswers[block.question_id];
            const isAnswered = Boolean(selectedOpt);
            const isCorrect = selectedOpt === block.correct_option_id;

            return (
              <div
                key={bIdx}
                className="w-full bg-[#070b28] border-y sm:border border-amber-500/30 p-5 sm:p-7 rounded-none"
              >
                <div className="flex items-center gap-2 text-amber-400 font-bold text-xs tracking-widest uppercase mb-3">
                  <Sparkles size={16} />
                  <span>Củng cố</span>
                </div>

                <Paragraph className="!text-slate-100 font-medium !text-base sm:!text-lg leading-snug mb-5 whitespace-pre-wrap">
                  {renderTextWithNewlines(block.prompt)}
                </Paragraph>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {block.options?.map((opt) => {
                    const isSelected = selectedOpt === opt.id;
                    const isRightOpt = opt.id === block.correct_option_id;

                    let btnClass = 'border-slate-800 bg-[#090f36] text-slate-300 hover:border-cyan-500/50 hover:bg-[#0c1447]';
                    if (isAnswered) {
                      if (isRightOpt) {
                        btnClass = 'border-emerald-500 bg-[#063024] text-emerald-300 font-bold shadow-[0_0_10px_rgba(16,185,129,0.2)]';
                      } else if (isSelected && !isRightOpt) {
                        btnClass = 'border-rose-500 bg-[#380e1b] text-rose-300';
                      } else {
                        btnClass = 'opacity-30 border-slate-900 bg-[#040718] text-slate-600';
                      }
                    }

                    return (
                      <button
                        key={opt.id}
                        disabled={isAnswered}
                        onClick={() => handleSelectQuickOption(block.question_id, opt.id)}
                        className={`w-full p-3.5 px-4 text-left rounded-none border transition-all flex justify-between items-center text-sm sm:text-base ${btnClass}`}
                      >
                        <span className="leading-snug whitespace-pre-wrap">
                          <strong className="mr-2 text-slate-400">{opt.id}.</strong>
                          {renderTextWithNewlines(opt.text)}
                        </span>
                        {isAnswered && isRightOpt && <CheckCircle size={18} className="text-emerald-400 shrink-0" />}
                        {isAnswered && isSelected && !isRightOpt && <XCircle size={18} className="text-rose-400 shrink-0" />}
                      </button>
                    );
                  })}
                </div>

                {isAnswered && block.explanation && (
                  <div className={`mt-5 p-4 rounded-none border text-sm ${
                    isCorrect 
                      ? 'bg-[#04281f]/80 border-emerald-500/50 text-emerald-200' 
                      : 'bg-[#151d45]/80 border-cyan-500/40 text-cyan-200'
                  }`}>
                    <div className="font-bold mb-1 uppercase text-xs tracking-wider">
                      {isCorrect ? 'Chính xác' : 'Giải thích'}
                    </div>
                    <div className="whitespace-pre-wrap">
                      {renderTextWithNewlines(block.explanation)}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default QuizBTheoryView;