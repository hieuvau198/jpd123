import React, { useState, useEffect } from 'react';
import { Button, Tag, Progress, message } from 'antd';
import { 
  Volume2, 
  RotateCw, 
  ChevronLeft, 
  ChevronRight, 
  Home, 
  Clock,
  CheckCircle2
} from 'lucide-react';
import { speakText } from '../../utils/speechUtils';
import SessionResult from '../SessionResult';

const FlashcardSession = ({ data, onHome, initialNumbers }) => {
  // Initialize cards state so items can be dynamically inserted into the queue
  const [cards, setCards] = useState(() => {
    const rawList = data?.questions || [];
    return initialNumbers && initialNumbers > 0 ? rawList.slice(0, initialNumbers) : [...rawList];
  });

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [touchStartX, setTouchStartX] = useState(null);
  const [isFinished, setIsFinished] = useState(false);

  // Sync state if initial data changes
  useEffect(() => {
    const rawList = data?.questions || [];
    const list = initialNumbers && initialNumbers > 0 ? rawList.slice(0, initialNumbers) : [...rawList];
    setCards(list);
    setCurrentIndex(0);
    setIsFlipped(false);
    setIsFinished(false);
  }, [data, initialNumbers]);

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

  // --- REPEAT AFTER 5 CARDS LOGIC ---
  const handleRepeatAfter5 = (e) => {
    if (e) e.stopPropagation();

    const targetInsertIndex = Math.min(currentIndex + 6, cards.length);
    const updatedCards = [...cards];

    // Insert a cloned copy 5 cards ahead
    updatedCards.splice(targetInsertIndex, 0, {
      ...currentCard,
      _retryId: Date.now() + Math.random(),
      isReview: true,
    });

    setCards(updatedCards);
    message.success("Card queued to review after 5 cards!");

    // Automatically transition to the next card
    handleNext();
  };

  // --- Swipe / Sweep Gestures ---
  const handleTouchStart = (e) => {
    setTouchStartX(e.touches[0].clientX);
  };

  const handleTouchEnd = (e) => {
    if (touchStartX === null) return;
    const touchEndX = e.changedTouches[0].clientX;
    const diff = touchStartX - touchEndX;

    if (diff > 50) {
      handleNext(); // Swipe left
    } else if (diff < -50) {
      handlePrev(); // Swipe right
    }
    setTouchStartX(null);
  };

  const handleRestart = () => {
    const rawList = data?.questions || [];
    const list = initialNumbers && initialNumbers > 0 ? rawList.slice(0, initialNumbers) : [...rawList];
    setCards(list);
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
        resultMessage={`You have reviewed all cards in this session!`}
      />
    );
  }

  const frontText = currentCard.word || currentCard.question || '';
  const backText = currentCard.meaning || currentCard.answer || 'No definition available';
  const progressPercent = Math.round(((currentIndex + 1) / cards.length) * 100);

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 flex flex-col items-center select-none">
      {/* Header Info */}
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

      {/* Progress */}
      <div className="w-full mb-6">
        <Progress 
          percent={progressPercent} 
          showInfo={false} 
          strokeColor="#faad14" 
          trailColor="rgba(255,255,255,0.3)" 
        />
      </div>

      {/* 3D Flip Card */}
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
              <div className="flex gap-1.5 items-center">
                {currentCard.typeBadge && (
                  <Tag color="blue" className="text-xs font-semibold px-2.5 py-0.5 rounded-full">
                    {currentCard.typeBadge}
                  </Tag>
                )}
                {currentCard.isReview && (
                  <Tag color="orange" className="text-xs font-semibold px-2 py-0.5 rounded-full flex items-center gap-1">
                    <Clock size={12} /> Repeat
                  </Tag>
                )}
              </div>
              <span className="text-xs text-gray-400 font-medium tracking-wider uppercase">
                Tap card to reveal
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
                Tap to flip back
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

      {/* Main Controls: Prev, Roll, Next */}
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

      {/* Extra Action: Repeat Card Later Button */}
      <div className="mt-4">
        <Button
          type="dashed"
          onClick={handleRepeatAfter5}
          icon={<Clock size={16} />}
          className="!text-white hover:!text-yellow-300 !border-white/40 hover:!border-yellow-400 !rounded-full !px-5 !py-1 !h-auto !bg-black/20 hover:!bg-black/30 transition-all text-sm font-medium"
        >
          Repeat after 5 cards
        </Button>
      </div>

      <p className="text-white/60 text-xs mt-3">
        Swipe left or right to switch cards
      </p>
    </div>
  );
};

export default FlashcardSession;