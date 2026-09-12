// src/components/flashcard/view/FlashcardControls.jsx
import React from 'react';
import { Flex, Button } from 'antd';
import { ArrowLeft, ArrowRight, RotateCw, Bookmark } from 'lucide-react';

const FlashcardControls = ({
  currentIndex,
  totalCards,
  isFlagged,
  onPrev,
  onFlip,
  onToggleFlag,
  onNext
}) => {
  return (
    <Flex justify="center" align="center" gap="middle" wrap="wrap">
      <Button
        size="large"
        icon={<ArrowLeft size={18} />}
        onClick={onPrev}
        disabled={currentIndex === 0}
        className="min-w-[100px] h-12 rounded-2xl bg-black/40 hover:bg-black/60 text-white font-medium border border-white/10 backdrop-blur-md shadow-md"
      />
      <Button
        type="primary"
        size="large"
        icon={<RotateCw size={18} />}
        onClick={onFlip}
        className="min-w-[125px] h-12 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 font-semibold shadow-lg shadow-indigo-500/25 border-0 text-white"
      />
      <Button
        size="large"
        icon={<Bookmark size={17} className={isFlagged ? "fill-amber-400 text-amber-400" : ""} />}
        onClick={onToggleFlag}
        className={`h-12 rounded-2xl font-semibold backdrop-blur-md shadow-md transition-all ${
          isFlagged 
            ? 'bg-amber-500/25 text-amber-300 border border-amber-400/50 hover:bg-amber-500/35' 
            : 'bg-black/40 text-amber-300/90 border border-white/10 hover:bg-black/60'
        }`}
      />
      <Button
        size="large"
        icon={<ArrowRight size={18} />}
        onClick={onNext}
        disabled={currentIndex === totalCards - 1}
        className="min-w-[100px] h-12 rounded-2xl bg-black/40 hover:bg-black/60 text-white font-medium border border-white/10 backdrop-blur-md shadow-md disabled:opacity-40"
      >
        {currentIndex === totalCards - 1 ? 'Hết' : ''}
      </Button>
    </Flex>
  );
};

export default FlashcardControls;