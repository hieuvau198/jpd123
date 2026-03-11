import React from 'react';
import { Button } from 'antd';
import { ArrowLeft } from 'lucide-react';

const DefinitionSession = ({ data, onBack }) => {
  return (
    <div className="min-h-screen p-4 sm:p-8 max-w-3xl mx-auto flex flex-col items-center">
      <div className="w-full flex justify-start mb-6">
        <Button icon={<ArrowLeft size={16} />} onClick={onBack}>
          Back to Modes
        </Button>
      </div>
      <div className="bg-white/10 p-12 rounded-2xl w-full text-center text-white border border-white/20">
        <h2 className="text-3xl font-bold mb-4">Definition Mode</h2>
        <p className="text-white/70">Coming soon... UI for reviewing {data?.title} equations.</p>
      </div>
    </div>
  );
};
export default DefinitionSession;