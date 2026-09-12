// src/components/flashcard/view/FlashcardTypeBSelector.jsx
import React from 'react';
import { Card, Checkbox, Button, Flex } from 'antd';
import { Layers } from 'lucide-react';

const FlashcardTypeBSelector = ({ selectedTypes, onChangeTypes, onStart, onBack }) => {
  const isAnySelected = selectedTypes.words || selectedTypes.phrases || selectedTypes.sentences;

  return (
    <div className="max-w-md mx-auto my-14 px-4">
      <Card className="rounded-3xl shadow-2xl border-0 bg-slate-900/90 text-white backdrop-blur-xl text-center p-6 border border-white/10">
        <Layers size={44} className="mx-auto text-cyan-400 mb-10" />
        <Flex vertical gap="middle" className="text-left max-w-xs mx-auto mb-8">
          <Checkbox
            checked={selectedTypes.words}
            onChange={(e) => onChangeTypes({ ...selectedTypes, words: e.target.checked })}
            className="text-base font-medium text-slate-200"
          >
            Từ vựng chính (Words)
          </Checkbox>
          <Checkbox
            checked={selectedTypes.phrases}
            onChange={(e) => onChangeTypes({ ...selectedTypes, phrases: e.target.checked })}
            className="text-base font-medium text-slate-200"
          >
            Cụm liên quan (Phrases)
          </Checkbox>
          <Checkbox
            checked={selectedTypes.sentences}
            onChange={(e) => onChangeTypes({ ...selectedTypes, sentences: e.target.checked })}
            className="text-base font-medium text-slate-200"
          >
            Câu hoàn chỉnh (Sentences)
          </Checkbox>
        </Flex>
        <Flex justify="center" gap="middle">
          <Button size="large" onClick={onBack} className="rounded-xl px-6 bg-white/10 text-white border-0 hover:bg-white/20">
            Quay lại
          </Button>
          <Button
            type="primary"
            size="large"
            disabled={!isAnySelected}
            onClick={onStart}
            className="rounded-xl px-8 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold border-0"
          >
            Bắt đầu
          </Button>
        </Flex>
      </Card>
    </div>
  );
};

export default FlashcardTypeBSelector;