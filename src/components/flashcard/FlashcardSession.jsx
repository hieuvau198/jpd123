import React, { useState } from 'react';
import { Button, Tag, Progress } from 'antd';
import { 
  Volume2, 
  RotateCw, 
  ChevronLeft, 
  ChevronRight, 
  Home, 
  RefreshCw 
} from 'lucide-react';
import { speakText } from '../../utils/speechUtils';
import SessionResult from '../SessionResult';

const FlashcardSession = ({ data, onHome, initialNumbers }) => {
  const rawList = data?.questions || [];
  const cards = initialNumbers && initialNumbers > 0 ? rawList.slice(0, initialNumbers) : rawList;

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [touchStartX, setTouchStartX] = useState(null);
  const [isFinished, setIsFinished] = useState(false);

  if (!cards.length) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-white">
        <p className="text-xl mb-4">No flashcards found in this set.</p>
        <Button onClick={onHome}>Back</Button>
      </div>
    );
  }

  const currentCard = cards[currentIndex];

  const handleFlip = (e) => {
    if (e) e.stopPropagation();
    setIsFlipped((prev) => !prev);
  };

  const handleNext = () => {
    setIsFlipped(false);
    if (currentIndex + 1 < cards.length) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      setIsFinished(true);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setIsFlipped(false);
      setCurrentIndex((prev) => prev - 1);
    }
  };

  // --- Touch Gestures (Swipe / Sweep) ---
  const handleTouchStart = (e) => {
    setTouchStartX(e.touches[0].clientX);
  };

  const handleTouchEnd = (e) => {
    if (touchStartX === null) return;
    const touchEndX = e.changedTouches[0].clientX;
    const diff = touchStartX - touchEndX;

    // Minimum swipe threshold of 50px
    if (diff > 50) {
      handleNext(); // Swiped left -> next
    } else if (diff < -50) {
      handlePrev(); // Swiped right -> prev
    }
    setTouchStartX(null);
  };

  const handleRestart = () => {
    setCurrentIndex(0);
    setIsFlipped(false);
    setIsFinished(false);
  };

  if (isFinished) {
    return (
      <SessionResult
        score={100}
        onBack={onHome}
        onRestart={handleRestart}
        practiceId={data.id}
        practiceType="Flashcard"
        practiceName={data.title}
        resultMessage={`You have reviewed all ${cards.length} cards in this set!`}
      />
    );
  }

  const frontText = currentCard.word || currentCard.question || '';
  const backText = currentCard.meaning || currentCard.answer || 'No definition available';
  const progressPercent = Math.round(((currentIndex + 1) / cards.length) * 100);

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 flex flex-col items-center select-none">
      {/* Top Bar */}
      <div className="w-full flex items-center justify-between mb-4 text-white">
        <Button 
          type="text" 
          icon={<Home size={18} />} 
          onClick={onHome} 
          className="!text-white hover:!bg-white/20"
        >
          Exit
        </Button>
        <span className="font-semibold text-lg drop-shadow">
          {currentIndex + 1} / {cards.length}
        </span>
      </div>

      {/* Progress Bar */}
      <div className="w-full mb-6">
        <Progress 
          percent={progressPercent} 
          showInfo={false} 
          strokeColor="#faad14" 
          trailColor="rgba(255,255,255,0.3)" 
        />
      </div>

      {/* 3D Flashcard Container */}
      <div
        className="perspective-container w-full h-80 sm:h-96 cursor-pointer"
        onClick={handleFlip}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <div className={`card-inner ${isFlipped ? 'flipped' : ''}`}>
          
          {/* SIDE 1: Word Only */}
          <div className="card-front bg-white/95 rounded-3xl shadow-2xl p-8 flex flex-col justify-between items-center text-center border border-white/40">
            <div className="w-full flex justify-between items-center">
              {currentCard.typeBadge ? (
                <Tag color="blue" className="text-xs font-semibold px-2.5 py-0.5 rounded-full">
                  {currentCard.typeBadge}
                </Tag>
              ) : <div />}
              <span className="text-xs text-gray-400 font-medium tracking-wider uppercase">
                Tap card to reveal meaning
              </span>
            </div>

            <div className="my-auto px-4">
              <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-800 tracking-wide break-words">
                {frontText}
              </h2>
              {currentCard.phonetic && (
                <p className="text-gray-400 text-base font-mono mt-2">{currentCard.phonetic}</p>
              )}
            </div>

            <div className="w-full flex justify-end">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  speakText(currentCard.speak || frontText);
                }}
                className="p-3 bg-indigo-50 text-indigo-600 rounded-full hover:bg-indigo-100 transition-colors shadow-sm"
                title="Listen"
              >
                <Volume2 size={22} />
              </button>
            </div>
          </div>

          {/* SIDE 2: Meaning */}
          <div className="card-back bg-gradient-to-br from-indigo-900 to-slate-900 text-white rounded-3xl shadow-2xl p-8 flex flex-col justify-between items-center text-center border border-indigo-500/30">
            <div className="w-full flex justify-between items-center">
              <Tag color="gold" className="text-xs font-semibold px-2.5 py-0.5 rounded-full">
                Meaning
              </Tag>
              <span className="text-xs text-indigo-300 font-medium tracking-wider uppercase">
                Tap card to see word
              </span>
            </div>

            <div className="my-auto px-4 max-h-52 overflow-y-auto">
              <p className="text-xl sm:text-2xl font-medium text-indigo-100 leading-relaxed break-words">
                {backText}
              </p>
            </div>

            <div className="w-full flex justify-end">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  speakText(currentCard.speak || frontText);
                }}
                className="p-3 bg-white/10 text-yellow-300 rounded-full hover:bg-white/20 transition-colors shadow-sm"
                title="Listen"
              >
                <Volume2 size={22} />
              </button>
            </div>
          </div>

        </div>
      </div>

      {/* Control Buttons (Roll, Prev, Next) */}
      <div className="flex items-center justify-center gap-6 mt-8">
        <Button
          size="large"
          shape="circle"
          icon={<ChevronLeft size={22} />}
          onClick={handlePrev}
          disabled={currentIndex === 0}
          className="!flex !items-center !justify-center !bg-white/90 shadow-md hover:scale-105"
        />

        <Button
          type="primary"
          size="large"
          onClick={handleFlip}
          icon={<RotateCw size={18} />}
          className="!bg-yellow-400 !text-black !font-bold hover:!bg-yellow-300 !border-none !px-6 !h-12 !rounded-full shadow-lg hover:scale-105 transition-transform flex items-center gap-2"
        >
          Roll Card
        </Button>

        <Button
          type="primary"
          size="large"
          shape="circle"
          icon={<ChevronRight size={22} />}
          onClick={handleNext}
          className="!flex !items-center !justify-center !bg-slate-900 !text-white shadow-md hover:scale-105"
        />
      </div>

      <p className="text-white/60 text-xs mt-4">
        Swipe left or right to change cards
      </p>
    </div>
  );
};

export default FlashcardSession;