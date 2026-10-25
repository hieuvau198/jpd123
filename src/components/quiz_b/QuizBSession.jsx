// src/components/quiz_b/QuizBSession.jsx
import React, { useState } from 'react';
import { ArrowLeft, BookOpen, Sparkles, Sun, Moon } from 'lucide-react';
import QuizBTheoryView from './QuizBTheoryView';
import QuizBPracticeView from './QuizBPracticeView';

const QuizBSession = ({ data, onHome }) => {
  const [activeTab, setActiveTab] = useState('theory');

  // Quản lý trạng thái nền Sáng / Tối riêng của Quiz-B (lưu vào localStorage)
  const [isLightMode, setIsLightMode] = useState(() => {
    return localStorage.getItem('quiz_b_theme') === 'light';
  });

  const toggleTheme = () => {
    setIsLightMode((prev) => {
      const nextMode = !prev;
      localStorage.setItem('quiz_b_theme', nextMode ? 'light' : 'dark');
      return nextMode;
    });
  };

  return (
    <div
      className={`w-full min-h-screen font-sans pb-16 pt-12 transition-colors duration-300 ${
        isLightMode ? 'bg-slate-100 text-slate-800' : 'bg-[#020617] text-slate-100'
      }`}
    >
      {/* Header trên viền */}
      <div
        className={`w-full px-4 py-3 flex justify-between items-center mb-6 backdrop-blur-md border-b transition-colors duration-300 ${
          isLightMode
            ? 'bg-white/80 border-slate-200'
            : 'bg-[#070b24]/90 border-cyan-950/80'
        }`}
      >
        <button
          onClick={onHome}
          className={`w-10 h-10 rounded-none border flex items-center justify-center transition-all ${
            isLightMode
              ? 'border-slate-300 bg-white text-slate-700 hover:bg-slate-100'
              : 'border-cyan-500/30 bg-[#0c1236] text-cyan-400 hover:border-cyan-400'
          }`}
        >
          <ArrowLeft size={18} />
        </button>

        <div className="flex items-center gap-2">
          {/* Nút Tab Lý Thuyết */}
          <button
            onClick={() => setActiveTab('theory')}
            className={`flex items-center gap-2 px-5 py-2 rounded-none text-sm font-semibold border transition-all ${
              activeTab === 'theory'
                ? isLightMode
                  ? 'bg-cyan-50 border-cyan-500 text-cyan-700 shadow-sm'
                  : 'bg-[#121c4b] border-cyan-400 text-cyan-300 shadow-[0_0_12px_rgba(34,211,238,0.25)]'
                : isLightMode
                ? 'bg-white border-slate-300 text-slate-600 hover:bg-slate-50'
                : 'bg-[#070d29] border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
            }`}
          >
            <BookOpen size={16} />
            <span>Lý thuyết</span>
          </button>

          {/* Nút Tab Luyện Tập */}
          <button
            onClick={() => setActiveTab('practice')}
            className={`flex items-center gap-2 px-5 py-2 rounded-none text-sm font-semibold border transition-all ${
              activeTab === 'practice'
                ? isLightMode
                  ? 'bg-fuchsia-50 border-fuchsia-500 text-fuchsia-700 shadow-sm'
                  : 'bg-[#2a133b] border-fuchsia-400 text-fuchsia-300 shadow-[0_0_12px_rgba(232,121,249,0.25)]'
                : isLightMode
                ? 'bg-white border-slate-300 text-slate-600 hover:bg-slate-50'
                : 'bg-[#070d29] border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
            }`}
          >
            <Sparkles size={16} />
            <span>Luyện tập</span>
          </button>

          {/* Nút Chuyển Đổi Nền Sáng / Tối */}
          <button
            onClick={toggleTheme}
            title={isLightMode ? 'Chuyển sang nền tối' : 'Chuyển sang nền sáng'}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-none text-sm font-medium border transition-all ${
              isLightMode
                ? 'bg-amber-50 border-amber-300 text-amber-700 hover:bg-amber-100'
                : 'bg-[#0c1236] border-cyan-500/40 text-yellow-300 hover:border-cyan-400'
            }`}
          >
            {isLightMode ? <Moon size={16} /> : <Sun size={16} />}
            <span className="hidden sm:inline text-xs font-bold uppercase">
              {isLightMode ? 'Tối' : 'Sáng'}
            </span>
          </button>
        </div>
      </div>

      {/* Nội dung trên view */}
      <div className="w-full">
        {activeTab === 'theory' ? (
          <QuizBTheoryView
            sections={data?.theory?.sections || []}
            onGoToPractice={() => setActiveTab('practice')}
            isLightMode={isLightMode}
          />
        ) : (
          <QuizBPracticeView
            practiceData={data?.practice}
            quizId={data?.id}
            quizTitle={data?.title}
            onHome={onHome}
            isLightMode={isLightMode}
          />
        )}
      </div>
    </div>
  );
};

export default QuizBSession;