import React from 'react';
import { ChevronRight, BookOpen, Brain, Tag as TagIcon } from 'lucide-react';
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

const PracticeCard = ({ practice, onClick }) => {
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
          {practice.subject && (
            <span className="shrink-0 px-2 py-1 rounded-md bg-red-50 text-red-600 text-xs font-semibold border border-red-100">
              {getSubjectName(practice.subject)}
            </span>
          )}
        </div>
      </div>
      
      <div className="flex justify-between items-end mt-auto">
        <div className="flex flex-col gap-3 w-full">
          <div className="flex items-center gap-2 text-gray-500">
            <div className={`p-1.5 rounded-full ${practice.type === 'flashcard' ? 'bg-blue-50 text-blue-500' : 'bg-purple-50 text-purple-500'}`}>
              {practice.type === 'flashcard' ? <BookOpen size={14} /> : <Brain size={14} />}
            </div>
            <span className="text-xs font-medium uppercase tracking-wide">
              {practice.questions ? practice.questions.length : 0} items
            </span>
          </div>

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