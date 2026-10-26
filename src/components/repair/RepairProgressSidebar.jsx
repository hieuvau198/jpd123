// src/components/repair/RepairProgressSidebar.jsx
import React from 'react';
import { List as ListIcon, Check, X } from 'lucide-react';

const RepairProgressSidebar = ({
  sessionState,
  currentIndex,
  totalQuestions,
  onSelectIndex,
}) => {
  const completedCount = sessionState.filter((s) => s.status !== 'pending').length;
  const progressPercent = totalQuestions > 0 ? (completedCount / totalQuestions) * 100 : 0;

  return (
    <div className="bg-white/90 backdrop-blur-sm rounded-3xl p-6 shadow-md border border-slate-100 lg:sticky lg:top-6">
      <div className="flex items-center gap-2 mb-6 text-slate-700 font-bold">
        <ListIcon size={20} />
        <span>Tiến trình</span>
      </div>

      <div className="grid grid-cols-5 lg:grid-cols-4 gap-2.5">
        {sessionState.map((state, idx) => {
          let btnClass = 'bg-slate-100 text-slate-500 hover:bg-slate-200 border-slate-200';
          let icon = null;

          if (idx === currentIndex) {
            btnClass =
              'ring-2 ring-offset-2 ring-indigo-500 bg-white text-indigo-600 border-indigo-200 font-bold';
          } else if (state.status === 'correct') {
            btnClass = 'bg-emerald-100 text-emerald-600 border-emerald-200';
            icon = <Check size={14} strokeWidth={3} />;
          } else if (state.status === 'incorrect') {
            btnClass = 'bg-rose-100 text-rose-500 border-rose-200';
            icon = <X size={14} strokeWidth={3} />;
          }

          return (
            <button
              key={idx}
              onClick={() => onSelectIndex(idx)}
              className={`aspect-square rounded-xl flex flex-col items-center justify-center text-sm font-semibold transition-all border ${btnClass}`}
            >
              {icon || idx + 1}
            </button>
          );
        })}
      </div>

      <div className="mt-8 pt-6 border-t border-slate-100">
        <div className="flex justify-between items-center text-sm text-slate-500 mb-2">
          <span>Đã hoàn thành</span>
          <span className="font-bold text-slate-800">
            {completedCount} / {totalQuestions}
          </span>
        </div>
        <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
          <div
            className="bg-indigo-600 h-full transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>
    </div>
  );
};

export default RepairProgressSidebar;