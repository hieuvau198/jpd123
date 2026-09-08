// src/components/quiz_b/QuizBTheoryView.jsx
import React, { useState } from 'react';
import { Card, Typography, Button, Table, Alert, Tag, Flex } from 'antd';
import { CheckCircle, XCircle, ArrowRight, HelpCircle } from 'lucide-react';

const { Title, Text, Paragraph } = Typography;

const QuizBTheoryView = ({ sections = [], onGoToPractice }) => {
  const [activeSectionIdx, setActiveSectionIdx] = useState(0);
  const [quickAnswers, setQuickAnswers] = useState({});

  if (!sections.length) {
    return <div className="text-center p-8 text-gray-500">Chưa có nội dung lý thuyết.</div>;
  }

  const currentSection = sections[activeSectionIdx] || sections[0];

  const handleSelectQuickOption = (qId, optId) => {
    setQuickAnswers((prev) => ({ ...prev, [qId]: optId }));
  };

  const renderBlock = (block, bIdx) => {
    switch (block.type) {
      case 'text':
        return (
          <div key={bIdx} style={{ textAlign: block.align || 'left', marginBottom: 16 }}>
            {block.spans?.map((span, sIdx) => (
              <span
                key={sIdx}
                style={{
                  fontWeight: span.bold ? 700 : 400,
                  color: span.color || '#1f2937',
                  fontSize: block.size === 'lg' ? '1.15rem' : block.size === 'sm' ? '0.9rem' : '1rem',
                  lineHeight: 1.6,
                }}
              >
                {span.text}
              </span>
            ))}
          </div>
        );

      case 'image':
        return (
          <div key={bIdx} className="my-6 text-center">
            <img
              src={block.url}
              alt={block.alt || 'Theory visual'}
              className="rounded-xl max-h-80 mx-auto object-contain border border-gray-100 shadow-sm"
            />
            {block.caption && (
              <Text type="secondary" className="block mt-2 text-xs italic">
                {block.caption}
              </Text>
            )}
          </div>
        );

      case 'table': {
        // Hỗ trợ cả format mới (columns/rows: [{cells}]) và format cũ phòng hờ
        const rawCols = block.columns || (Array.isArray(block.headers?.[0]) ? block.headers[0] : block.headers) || [];
        const rawRows = block.rows || [];

        const columns = rawCols.map((col, cIdx) => ({
          title: (
            <span style={{ fontWeight: col.bold ? 'bold' : 'normal', color: col.color || 'inherit' }}>
              {col.text}
            </span>
          ),
          dataIndex: `col_${cIdx}`,
          key: col.key || `col_${cIdx}`,
          align: col.align || 'center',
          render: (cell) => (
            <span style={{ fontWeight: cell?.bold ? 600 : 400, color: cell?.color || '#374151' }}>
              {cell?.text || cell || ''}
            </span>
          ),
        }));

        const dataSource = rawRows.map((rowItem, rIdx) => {
          const rowObj = { key: rowItem.row_id || rIdx };
          // Nếu dạng mới rowItem.cells là mảng, dạng cũ rowItem là mảng
          const cells = Array.isArray(rowItem.cells) ? rowItem.cells : (Array.isArray(rowItem) ? rowItem : []);
          cells.forEach((cell, cIdx) => {
            rowObj[`col_${cIdx}`] = cell;
          });
          return rowObj;
        });

        return (
          <div key={bIdx} className="my-4 overflow-x-auto">
            <Table
              bordered
              size="middle"
              pagination={false}
              columns={columns}
              dataSource={dataSource}
              className="bg-white rounded-lg shadow-sm"
            />
          </div>
        );
      }

      case 'quick_quiz': {
        const selectedOpt = quickAnswers[block.question_id];
        const isAnswered = Boolean(selectedOpt);
        const isCorrect = selectedOpt === block.correct_option_id;

        return (
          <Card
            key={bIdx}
            className="my-6 border border-amber-200 bg-amber-50/40 rounded-2xl"
            styles={{ body: { padding: '20px' } }}
          >
            <Flex align="center" gap={8} className="mb-3 text-amber-700 font-semibold">
              <HelpCircle size={18} />
              <span>Câu hỏi tương tác nhanh</span>
            </Flex>
            <Paragraph strong className="text-base text-gray-800 mb-4">
              {block.prompt}
            </Paragraph>
            <Flex vertical gap="small">
              {block.options?.map((opt) => {
                const isSelected = selectedOpt === opt.id;
                const isRightOpt = opt.id === block.correct_option_id;
                let btnClass = 'border-gray-200 bg-white text-gray-700';
                if (isAnswered) {
                  if (isRightOpt) btnClass = 'border-green-500 bg-green-50 text-green-700 font-bold';
                  else if (isSelected && !isRightOpt) btnClass = 'border-red-400 bg-red-50 text-red-700';
                  else btnClass = 'opacity-50 bg-white text-gray-400';
                }
                return (
                  <Button
                    key={opt.id}
                    block
                    className={`h-auto py-2.5 text-left flex justify-between items-center rounded-xl border-2 transition-all ${btnClass}`}
                    onClick={() => !isAnswered && handleSelectQuickOption(block.question_id, opt.id)}
                  >
                    <span>
                      <strong>{opt.id}.</strong> {opt.text}
                    </span>
                    {isAnswered && isRightOpt && <CheckCircle size={18} className="text-green-600" />}
                    {isAnswered && isSelected && !isRightOpt && <XCircle size={18} className="text-red-500" />}
                  </Button>
                );
              })}
            </Flex>
            {isAnswered && block.explanation && (
              <Alert
                type={isCorrect ? 'success' : 'info'}
                showIcon
                className="mt-4 rounded-xl"
                message={isCorrect ? 'Chính xác!' : 'Giải thích:'}
                description={block.explanation}
              />
            )}
          </Card>
        );
      }

      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none border-b border-gray-100">
        {sections.map((sec, idx) => (
          <button
            key={sec.section_id || idx}
            onClick={() => setActiveSectionIdx(idx)}
            className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm font-semibold whitespace-nowrap transition-all ${
              activeSectionIdx === idx
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {sec.title || `Mục ${idx + 1}`}
          </button>
        ))}
      </div>

      <Card className="shadow-md rounded-2xl border-0 bg-white p-2 sm:p-4">
        <Title level={4} className="!mb-6 text-slate-800 border-b pb-3 border-gray-100">
          {currentSection.title}
        </Title>
        <div className="flex flex-col">
          {currentSection.blocks?.map((blk, idx) => renderBlock(blk, idx))}
        </div>

        <Flex justify="space-between" align="center" className="mt-8 pt-4 border-t border-gray-100">
          <Button
            disabled={activeSectionIdx === 0}
            onClick={() => setActiveSectionIdx((prev) => prev - 1)}
            className="rounded-xl"
          >
            Mục trước
          </Button>
          {activeSectionIdx < sections.length - 1 ? (
            <Button
              type="primary"
              onClick={() => setActiveSectionIdx((prev) => prev + 1)}
              className="bg-blue-600 rounded-xl"
            >
              Mục tiếp theo
            </Button>
          ) : (
            <Button
              type="primary"
              onClick={onGoToPractice}
              icon={<ArrowRight size={16} />}
              className="bg-green-600 hover:bg-green-500 rounded-xl font-semibold border-none"
            >
              Bắt đầu Luyện tập
            </Button>
          )}
        </Flex>
      </Card>
    </div>
  );
};

export default QuizBTheoryView;