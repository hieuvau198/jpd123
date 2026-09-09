// src/components/quiz_b/QuizBSession.jsx
import React, { useState } from 'react';
import { ArrowLeft, BookOpen, Sparkles } from 'lucide-react';
import QuizBTheoryView from './QuizBTheoryView';
import QuizBPracticeView from './QuizBPracticeView';

const QuizBSession = ({ data, onHome }) => {
  const [activeTab, setActiveTab] = useState('theory');

  return (
    <div className="w-full min-h-screen bg-[#020617] text-slate-100 font-sans pb-16 pt-12">
      {/* Header tràn viền góc cạnh */}
      <div className="w-full border-b border-cyan-950/80 bg-[#070b24]/90 backdrop-blur-md px-4 py-3 flex justify-between items-center mb-6">
        <button
          onClick={onHome}
          className="w-10 h-10 rounded-none border border-cyan-500/30 bg-[#0c1236] text-cyan-400 hover:border-cyan-400 flex items-center justify-center transition-all"
        >
          <ArrowLeft size={18} />
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('theory')}
            className={`flex items-center gap-2 px-5 py-2 rounded-none text-sm font-semibold border transition-all ${
              activeTab === 'theory'
                ? 'bg-[#121c4b] border-cyan-400 text-cyan-300 shadow-[0_0_12px_rgba(34,211,238,0.25)]'
                : 'bg-[#070d29] border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
            }`}
          >
            <BookOpen size={16} />
            <span>Lý thuyết</span>
          </button>
          
          <button
            onClick={() => setActiveTab('practice')}
            className={`flex items-center gap-2 px-5 py-2 rounded-none text-sm font-semibold border transition-all ${
              activeTab === 'practice'
                ? 'bg-[#2a133b] border-fuchsia-400 text-fuchsia-300 shadow-[0_0_12px_rgba(232,121,249,0.25)]'
                : 'bg-[#070d29] border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
            }`}
          >
            <Sparkles size={16} />
            <span>Luyện tập</span>
          </button>
        </div>
      </div>

      {/* Nội dung tràn viền */}
      <div className="w-full">
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