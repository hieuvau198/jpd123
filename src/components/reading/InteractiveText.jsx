// src/components/reading/InteractiveText.jsx
import React from 'react';
import { Popover } from 'antd';

// Helper nhận dạng chuỗi "\n" (literal) và ký tự xuống dòng thật '\n' thành thẻ <br />
const renderTextWithBreaks = (content, keyPrefix = 'txt') => {
  if (typeof content !== 'string') return content;
  const normalized = content.replace(/\\n/g, '\n');
  return normalized.split('\n').map((line, idx, arr) => (
    <React.Fragment key={`${keyPrefix}-${idx}`}>
      {line}
      {idx < arr.length - 1 && <br />}
    </React.Fragment>
  ));
};

const InteractiveText = ({ text = '', glossary = {} }) => {
  if (!text) return null;

  // Trường hợp không có glossary: trả về text đã được chuyển đổi xuống dòng
  if (!glossary || Object.keys(glossary).length === 0) {
    return <span className="leading-relaxed">{renderTextWithBreaks(text, 'plain')}</span>;
  }

  // Sắp xếp các từ khóa trong glossary theo độ dài giảm dần để ưu tiên cụm từ dài trước
  const sortedKeys = Object.keys(glossary).sort((a, b) => b.length - a.length);

  // Tạo Regex pattern
  const escapeRegExp = (string) => string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regexPattern = new RegExp(
    `\\b(${sortedKeys.map((k) => escapeRegExp(k)).join('|')})\\b`,
    'gi'
  );

  const parts = [];
  let lastIndex = 0;
  let match;

  while ((match = regexPattern.exec(text)) !== null) {
    const matchedText = match[0];
    const matchIndex = match.index;

    // Đẩy phần văn bản thông thường trước match (có xử lý xuống dòng)
    if (matchIndex > lastIndex) {
      parts.push(
        renderTextWithBreaks(text.slice(lastIndex, matchIndex), `pre-${lastIndex}`)
      );
    }

    // Tìm từ khóa tương ứng trong glossary
    const lowerKey = matchedText.toLowerCase();
    const matchedKey = sortedKeys.find((k) => k.toLowerCase() === lowerKey) || lowerKey;
    const vocabInfo = glossary[matchedKey];

    if (vocabInfo) {
      parts.push(
        <Popover
          key={`${matchIndex}-${matchedText}`}
          title={
            <div className="flex items-center gap-2">
              <span className="font-bold text-blue-600">{matchedText}</span>
              {vocabInfo.pos && (
                <span className="text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded font-mono">
                  {vocabInfo.pos}
                </span>
              )}
            </div>
          }
          content={
            <div className="max-w-xs text-sm text-gray-700">
              {renderTextWithBreaks(vocabInfo.m, `glossary-def-${matchIndex}`)}
            </div>
          }
          trigger="click"
        >
          <span className="cursor-pointer border-b-2 border-dashed border-amber-400 hover:bg-amber-100/60 rounded px-0.5 transition-colors font-medium text-slate-900">
            {matchedText}
          </span>
        </Popover>
      );
    } else {
      parts.push(matchedText);
    }

    lastIndex = regexPattern.lastIndex;
  }

  // Đẩy phần văn bản còn lại sau từ khóa cuối cùng (có xử lý xuống dòng)
  if (lastIndex < text.length) {
    parts.push(
      renderTextWithBreaks(text.slice(lastIndex), `post-${lastIndex}`)
    );
  }

  return <span className="leading-relaxed">{parts}</span>;
};

export default InteractiveText;
