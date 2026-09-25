// src/components/reading/ReadingSessionHeader.jsx
import React from 'react';
import { Button, Typography, Tag } from 'antd';
import { ArrowLeft, Trophy } from 'lucide-react';

const { Title } = Typography;

const ReadingSessionHeader = ({ 
  data, 
  submitted, 
  scoreResult, 
  onBack, 
  onSubmit, 
  onReset,
  onShowResult 
}) => {
  return (
    <div className="flex flex-col gap-4 mb-6">
      <Button
        icon={<ArrowLeft size={16} />}
        onClick={onBack}
        className="mt-4 w-fit bg-white/20 hover:bg-white/40 text-white border-0"
      >
        Danh sách Bài
      </Button>
      <div className="bg-white/95 backdrop-blur-md p-6 rounded-2xl shadow-lg flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <Title level={2} style={{ margin: 0 }}>{data.title}</Title>
          <div className="flex gap-2 mt-2 flex-wrap">
            {data.tags?.map(t => <Tag color="blue" key={t}>{t}</Tag>)}
            <Tag color="orange">Nhấp từ để tra nghĩa</Tag>
          </div>
        </div>
        {!submitted ? (
          <Button
            type="primary"
            size="large"
            onClick={onSubmit}
            className="bg-emerald-600 hover:bg-emerald-500 border-0 h-12 px-8 font-bold rounded-xl shadow-lg text-white"
          >
            Nộp bài
          </Button>
        ) : (
          <div className="flex items-center gap-3">
            <div className="text-right mr-2">
              <div className="text-2xl font-black text-emerald-600">
                {scoreResult?.score}%
              </div>
              <div className="text-xs text-gray-500">
                Đúng {scoreResult?.totalCorrect}/{scoreResult?.totalQuestions} câu
              </div>
            </div>
            <Button 
              type="primary" 
              icon={<Trophy size={16} />} 
              onClick={onShowResult}
              className="bg-amber-500 hover:bg-amber-400 border-none font-semibold text-white"
            >
              Xem kết quả
            </Button>
            <Button onClick={onReset}>Làm lại</Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReadingSessionHeader;