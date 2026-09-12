// src/components/PracticeCard.jsx
import React from 'react';
import { Tag as TagIcon, CheckCircle2 } from 'lucide-react';
import SUBJECTS_DATA from '../data/system/subjects.json';
import TAGS_DATA from '../data/system/tags.json';

const getTagName = (tagId) => {
  const tag = TAGS_DATA.find(t => t.id === tagId);
  return tag ? tag.name : tagId;
};

const getSubjectName = (subjectId) => {
  const sub = SUBJECTS_DATA.find(s => s.id === subjectId);
  return sub ? sub.name : subjectId;
};

const PracticeCard = ({ practice, onClick, userProgress }) => {
  // Kiểm tra bài tập đã được làm chưa
  const isCompleted = userProgress !== undefined && userProgress !== null;
  const score = isCompleted ? (userProgress.completion ?? 0) : null;

  // Xác định màu sắc dựa theo % điểm số
  const getScoreColor = (pts) => {
    if (pts >= 80) return 'text-emerald-600 bg-emerald-50 border-emerald-300';
    if (pts >= 50) return 'text-amber-600 bg-amber-50 border-amber-300';
    return 'text-rose-600 bg-rose-50 border-rose-300';
  };

  return (
    <div
      onClick={() => onClick(practice)}
      className="group relative bg-white/95 backdrop-blur-sm rounded-xl p-5 shadow-md hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer border border-white/20 h-full flex flex-col justify-between"
    >
      {/* Decorative top border for hover effect */}
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-500 to-yellow-500 rounded-t-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      
      <div className="mb-4">
        <div className="flex justify-between items-start gap-2 mb-2">
          <h3 className="font-bold text-gray-800 text-lg leading-tight line-clamp-2 group-hover:text-red-600 transition-colors">
            {practice.title}
          </h3>

          {/* Dấu hiệu ĐÃ LÀM + ĐIỂM SỐ PHẦN TRĂM (%) */}
          {isCompleted && (
            <div className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold border shrink-0 shadow-sm ${getScoreColor(score)}`}>
              <CheckCircle2 size={13} className="stroke-[2.5]" />
              <span>{score}%</span>
            </div>
          )}
        </div>
      </div>

      <div className="flex justify-between items-end mt-auto">
        <div className="flex flex-col gap-3 w-full">
          {practice.tags && practice.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 border-t border-gray-100 pt-3 w-full">
              {practice.tags.map(tagId => (
                <span key={tagId} className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 text-[10px] font-medium border border-gray-200">
                  <TagIcon size={10} className="opacity-50" />
                  {getTagName(tagId)}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PracticeCard;