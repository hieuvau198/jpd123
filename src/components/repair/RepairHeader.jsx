// src/components/repair/RepairHeader.jsx
import React from 'react';
import { Button, Typography } from 'antd';
import { ArrowLeft } from 'lucide-react';

const { Title } = Typography;

const RepairHeader = ({ title, percentParam, totalCount, onBack }) => {
  return (
    <div className="w-full flex justify-between items-center mb-6 px-2">
      <Button
        type="text"
        icon={<ArrowLeft size={20} />}
        onClick={onBack}
        className="hover:bg-white/50 rounded-full text-white/90"
      >
        Thoát
      </Button>

      <div className="flex items-center gap-2">
        <Title level={4} className="!m-0 text-white font-bold hidden sm:block">
          {title}
        </Title>
        {percentParam && (
          <span className="bg-indigo-500/80 text-white text-xs px-2.5 py-0.5 rounded-full font-bold">
            {percentParam}% ({totalCount} câu)
          </span>
        )}
      </div>

      <div className="w-[80px]" />
    </div>
  );
};

export default RepairHeader;