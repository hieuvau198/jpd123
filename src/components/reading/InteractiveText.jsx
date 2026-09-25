// src/components/reading/InteractiveText.jsx
import React from 'react';
import { Popover } from 'antd';

const InteractiveText = ({ text = '', glossary = {} }) => {
  if (!text) return null;
  if (!glossary || Object.keys(glossary).length === 0) {
    return <span>{text}</span>;
  }

  // Sắp xếp các key trong glossary theo độ dài giảm dần (để ưu tiên bắt cụm từ dài trước)
  const sortedKeys = Object.keys(glossary).sort((a, b) => b.length - a.length);

  // Tạo Regex pattern bắt các cụm từ và từ đơn
  const escapeRegExp = (string) => string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regexPattern = new RegExp(
    `\\b(${sortedKeys.map(k => escapeRegExp(k)).join('|')})\\b`,
    'gi'
  );

  const parts = [];
  let lastIndex = 0;
  let match;

  while ((match = regexPattern.exec(text)) !== null) {
    const matchedText = match[0];
    const matchIndex = match.index;

    // Đẩy phần text thường trước match
    if (matchIndex > lastIndex) {
      parts.push(text.slice(lastIndex, matchIndex));
    }

    // Tìm key tương ứng trong glossary (không phân biệt hoa thường)
    const lowerKey = matchedText.toLowerCase();
    const matchedKey = sortedKeys.find(k => k.toLowerCase() === lowerKey) || lowerKey;
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
              {vocabInfo.m}
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

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return <span className="leading-relaxed">{parts}</span>;
};

export default InteractiveText;