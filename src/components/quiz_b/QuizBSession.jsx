// src/components/quiz_b/QuizBSession.jsx
import React, { useState } from 'react';
import { Button } from 'antd';
import { ArrowLeft, BookOpen, Sparkles } from 'lucide-react';
import QuizBTheoryView from './QuizBTheoryView';
import QuizBPracticeView from './QuizBPracticeView';

const QuizBSession = ({ data, onHome }) => {
  const [activeTab, setActiveTab] = useState('theory');

  return (
    <div className="max-w-4xl mx-auto px-3 sm:px-6 py-6 sm:py-8 mt-14 sm:mt-16 font-sans">
      {/* Header thanh lịch, bo góc lớn và shadow mềm mại */}
      <div className="flex justify-between items-center mb-6 bg-white/90 backdrop-blur-xl p-3 sm:p-4 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100/80">
        <Button
          type="text"
          icon={<ArrowLeft size={19} className="text-slate-600 group-hover:-translate-x-0.5 transition-transform" />}
          onClick={onHome}
          className="group !w-11 !h-11 rounded-2xl bg-slate-50 hover:!bg-slate-100/90 border border-slate-200/50 flex items-center justify-center transition-all shadow-xs"
        />

        <div className="flex items-center gap-2 bg-slate-100/80 p-1.5 rounded-2xl border border-slate-200/40">
          <button
            onClick={() => setActiveTab('theory')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-300 ${
              activeTab === 'theory'
                ? 'bg-white text-slate-900 shadow-sm shadow-slate-200/80'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <BookOpen size={16} className={activeTab === 'theory' ? 'text-blue-600' : 'text-slate-400'} />
            <span>Lý thuyết</span>
          </button>
          
          <button
            onClick={() => setActiveTab('practice')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-300 ${
              activeTab === 'practice'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Sparkles size={16} className={activeTab === 'practice' ? 'text-amber-300' : 'text-slate-400'} />
            <span>Luyện tập</span>
          </button>
        </div>
      </div>

      {/* View Content */}
      <div className="transition-opacity duration-300">
        {activeTab === 'theory' ? (
          <QuizBTheoryView
            sections={data?.theory?.sections || []}
            onGoToPractice={() => setActiveTab('practice')}
          />
        ) : (
          <QuizBPracticeView
            practiceData={data?.practice}
            quizId={data?.id}
            quizTitle={data?.title}
            onHome={onHome}
          />
        )}
      </div>
    </div>
  );
};

export default QuizBSession;