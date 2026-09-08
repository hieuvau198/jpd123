// src/components/quiz_b/QuizBSession.jsx
import React, { useState } from 'react';
import { Button, Typography, Tag, Flex } from 'antd';
import { ArrowLeft, BookOpen, Dumbbell } from 'lucide-react';
import QuizBTheoryView from './QuizBTheoryView';
import QuizBPracticeView from './QuizBPracticeView';

const { Title } = Typography;

const QuizBSession = ({ data, onHome }) => {
  // Mode: 'theory' (Lý thuyết) hoặc 'practice' (Luyện tập)
  const [activeTab, setActiveTab] = useState('theory');

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 mt-16 sm:mt-20">
      {/* Thanh Header nhỏ gọn */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-6 bg-white/80 backdrop-blur-md p-4 rounded-2xl shadow-sm">
        <div className="flex items-center gap-3">
          <Button
            type="text"
            icon={<ArrowLeft size={18} />}
            onClick={onHome}
            className="hover:bg-gray-100 rounded-full text-slate-700"
          >
            Quay lại
          </Button>
          <div>
            <Title level={4} className="!m-0 text-slate-800 line-clamp-1">
              {data?.title || 'Quiz B'}
            </Title>
            <div className="flex gap-1.5 mt-1">
              {data?.level && <Tag color="blue">{data.level}</Tag>}
              {data?.subject && <Tag color="cyan">{data.subject}</Tag>}
            </div>
          </div>
        </div>

        {/* Toggle chuyển chế độ Theory / Practice */}
        <div className="flex items-center bg-gray-100 p-1 rounded-xl self-center sm:self-auto">
          <button
            onClick={() => setActiveTab('theory')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              activeTab === 'theory'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            <BookOpen size={16} />
            <span>Lý thuyết</span>
          </button>
          <button
            onClick={() => setActiveTab('practice')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              activeTab === 'practice'
                ? 'bg-white text-purple-600 shadow-sm'
                : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            <Dumbbell size={16} />
            <span>Luyện tập</span>
          </button>
        </div>
      </div>

      {/* Khu vực nội dung hiển thị theo tab */}
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
  );
};

export default QuizBSession;