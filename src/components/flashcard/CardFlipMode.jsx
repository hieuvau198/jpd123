import React, { useState, useMemo } from 'react';
import { Button, Tag, Progress, Checkbox, Card, message } from 'antd';
import { 
  Volume2, 
  RotateCw, 
  ChevronLeft, 
  ChevronRight, 
  ArrowLeft, 
  Clock, 
  Play, 
  Layers 
} from 'lucide-react';
import { speakText } from '../../utils/speechUtils';
import SessionResult from '../SessionResult';

const buildCardQueue = (data, includePhrases, includeSentences, initialNumbers) => {
  if (!data) return [];

  // Handle flashcard-b structured words
  if (data.type === 'flashcard-b' && Array.isArray(data.words)) {
    const expandedList = [];
    let counter = 1;

    data.words.forEach((item) => {
      const wordMeaning = Array.isArray(item.defs)
        ? item.defs.map((d) => d.m || d.meaning || d).join(', ')
        : (item.meaning || item.answer || '');

      // 1. Base word
      expandedList.push({
        id: counter++,
        typeBadge: 'Từ vựng',
        word: item.word,
        phonetic: item.phonetic || item.ipa || '',
        meaning: wordMeaning,
        speak: item.word
      });

      // 2. Phrases (Optional)
      if (includePhrases && Array.isArray(item.phrases)) {
        item.phrases.forEach((phraseObj) => {
          const phraseText = typeof phraseObj === 'string' 
            ? phraseObj 
            : (phraseObj.phrase || phraseObj.text || phraseObj.en);
          const phraseMeaning = typeof phraseObj === 'string' 
            ? '' 
            : (phraseObj.meaning || phraseObj.m || phraseObj.vi || '');
          if (phraseText) {
            expandedList.push({
              id: counter++,
              typeBadge: 'Cụm từ',
              word: phraseText,
              meaning: phraseMeaning,
              speak: phraseText
            });
          }
        });
      }

      // 3. Sentences (Optional)
      if (includeSentences && Array.isArray(item.sentences)) {
        item.sentences.forEach((sentObj) => {
          const sentText = typeof sentObj === 'string' 
            ? sentObj 
            : (sentObj.sentence || sentObj.text || sentObj.en);
          const sentMeaning = typeof sentObj === 'string' 
            ? '' 
            : (sentObj.meaning || sentObj.m || sentObj.vi || '');
          if (sentText) {
            expandedList.push({
              id: counter++,
              typeBadge: 'Câu',
              word: sentText,
              meaning: sentMeaning,
              speak: sentText
            });
          }
        });
      }
    });

    return initialNumbers && initialNumbers > 0 ? expandedList.slice(0, initialNumbers) : expandedList;
  }

  // Handle standard questions/words flashcard format
  const rawList = (data.questions || data.words || []).map((q, idx) => ({
    id: idx + 1,
    typeBadge: 'Từ vựng',
    word: q.word || q.question || '',
    meaning: q.meaning || q.answer || (q.defs ? q.defs.map(d => d.m).join(', ') : ''),
    speak: q.speak || q.word || q.question || ''
  }));

  return initialNumbers && initialNumbers > 0 ? rawList.slice(0, initialNumbers) : rawList;
};

const CardFlipMode = ({ data, onBack, onHome, initialNumbers }) => {
  const hasExtraContent = useMemo(() => {
    if (data?.type !== 'flashcard-b' || !Array.isArray(data?.words)) return false;
    return data.words.some(w => (w.phrases && w.phrases.length > 0) || (w.sentences && w.sentences.length > 0));
  }, [data]);

  const [includePhrases, setIncludePhrases] = useState(true);
  const [includeSentences, setIncludeSentences] = useState(false);
  const [isConfigured, setIsConfigured] = useState(!hasExtraContent);

  const [cards, setCards] = useState(() => 
    !hasExtraContent ? buildCardQueue(data, false, false, initialNumbers) : []
  );
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [touchStartX, setTouchStartX] = useState(null);
  const [isFinished, setIsFinished] = useState(false);

  const handleStartPractice = () => {
    const generated = buildCardQueue(data, includePhrases, includeSentences, initialNumbers);
    setCards(generated);
    setCurrentIndex(0);
    setIsFlipped(false);
    setIsFinished(false);
    setIsConfigured(true);
  };

  // Dialog to configure phrases/sentences for flashcard-b
  if (!isConfigured) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-4">
        <Card className="w-full max-w-md rounded-3xl p-6 sm:p-8 shadow-2xl border-0 bg-white/95 backdrop-blur-md text-center">
          <div className="w-14 h-14 mx-auto mb-4 bg-yellow-100 text-yellow-600 rounded-2xl flex items-center justify-center">
            <Layers size={28} />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Tùy chọn học tập</h2>
          <p className="text-gray-500 text-sm mb-6">Chọn các loại nội dung bạn muốn luyện tập trong bộ thẻ này</p>

          <div className="flex flex-col gap-3 text-left bg-gray-50 p-4 rounded-2xl border border-gray-100 mb-6">
            <label className="flex items-center justify-between p-2 rounded-xl hover:bg-white transition-colors cursor-pointer">
              <span className="font-semibold text-gray-700">Từ vựng chính</span>
              <Checkbox checked disabled />
            </label>

            <label className="flex items-center justify-between p-2 rounded-xl hover:bg-white transition-colors cursor-pointer">
              <div>
                <span className="font-semibold text-gray-700 block">Cụm từ liên quan (Phrases)</span>
                <span className="text-xs text-gray-400">Tạo thẻ cho các cụm từ thuộc từ này</span>
              </div>
              <Checkbox 
                checked={includePhrases} 
                onChange={(e) => setIncludePhrases(e.target.checked)} 
              />
            </label>

            <label className="flex items-center justify-between p-2 rounded-xl hover:bg-white transition-colors cursor-pointer">
              <div>
                <span className="font-semibold text-gray-700 block">Câu ví dụ (Sentences)</span>
                <span className="text-xs text-gray-400">Tạo thẻ cho các câu mẫu thuộc từ này</span>
              </div>
              <Checkbox 
                checked={includeSentences} 
                onChange={(e) => setIncludeSentences(e.target.checked)} 
              />
            </label>
          </div>

          <div className="flex gap-3">
            <Button size="large" onClick={onBack} className="flex-1 rounded-xl h-12">
              Quay lại
            </Button>
            <Button 
              type="primary" 
              size="large" 
              icon={<Play size={18} />} 
              onClick={handleStartPractice}
              className="flex-1 !bg-yellow-400 !text-black !font-bold hover:!bg-yellow-300 !border-none rounded-xl h-12 flex items-center justify-center"
            >
              Bắt đầu
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  if (!cards.length) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-white">
        <p className="text-xl mb-4">Không có thẻ nào được tạo theo thiết lập đã chọn.</p>
        <Button onClick={() => setIsConfigured(false)}>Chọn lại</Button>
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

  // Re-queues the card 5 positions ahead
  const handleRepeatAfter5 = (e) => {
    if (e) e.stopPropagation();

    const targetInsertIndex = Math.min(currentIndex + 6, cards.length);
    const updatedCards = [...cards];

    updatedCards.splice(targetInsertIndex, 0, {
      ...currentCard,
      _retryId: Date.now() + Math.random(),
      isReview: true,
    });

    setCards(updatedCards);
    message.success("Thẻ sẽ được lặp lại sau 5 thẻ nữa!");
    handleNext();
  };

  const handleTouchStart = (e) => {
    setTouchStartX(e.touches[0].clientX);
  };

  const handleTouchEnd = (e) => {
    if (touchStartX === null) return;
    const touchEndX = e.changedTouches[0].clientX;
    const diff = touchStartX - touchEndX;

    if (diff > 50) {
      handleNext();
    } else if (diff < -50) {
      handlePrev();
    }
    setTouchStartX(null);
  };

  const handleRestart = () => {
    if (hasExtraContent) {
      setIsConfigured(false);
    } else {
      const generated = buildCardQueue(data, false, false, initialNumbers);
      setCards(generated);
      setCurrentIndex(0);
      setIsFlipped(false);
      setIsFinished(false);
    }
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
        resultMessage={`Bạn đã hoàn thành xem toàn bộ ${cards.length} thẻ trong lượt học này!`}
      />
    );
  }

  const frontText = currentCard.word || currentCard.question || '';
  const backText = currentCard.meaning || currentCard.answer || 'Chưa có định nghĩa';
  const progressPercent = Math.round(((currentIndex + 1) / cards.length) * 100);

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 flex flex-col items-center select-none">
      {/* Header Bar */}
      <div className="w-full flex items-center justify-between mb-4 text-white">
        <Button 
          type="text" 
          icon={<ArrowLeft size={18} />} 
          onClick={onBack} 
          className="!text-white hover:!bg-white/20"
        >
          Đổi chế độ
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
                    <Clock size={12} /> Lặp lại
                  </Tag>
                )}
              </div>
              <span className="text-xs text-gray-400 font-medium tracking-wider uppercase">
                Nhấn để xem nghĩa
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
                title="Phát âm"
              >
                <Volume2 size={22} />
              </button>
            </div>
          </div>

          {/* SIDE 2: Meaning */}
          <div className="card-back bg-gradient-to-br from-indigo-900 to-slate-900 text-white rounded-3xl shadow-2xl p-8 flex flex-col justify-between items-center text-center border border-indigo-500/30">
            <div className="w-full flex justify-between items-center">
              <Tag color="gold" className="text-xs font-semibold px-2.5 py-0.5 rounded-full">
                Nghĩa
              </Tag>
              <span className="text-xs text-indigo-300 font-medium tracking-wider uppercase">
                Nhấn để xoay lại
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
                title="Phát âm"
              >
                <Volume2 size={22} />
              </button>
            </div>
          </div>

        </div>
      </div>

      {/* Control Buttons */}
      <div className="flex items-center justify-center gap-3 sm:gap-4 mt-8 flex-wrap">
        <Button
          size="large"
          shape="circle"
          icon={<ChevronLeft size={22} />}
          onClick={handlePrev}
          disabled={currentIndex === 0}
          className="!flex !items-center !justify-center !bg-white/90 shadow-md hover:scale-105"
        />

        <Button
          type="dashed"
          size="large"
          onClick={handleRepeatAfter5}
          icon={<Clock size={16} />}
          className="!text-white hover:!text-yellow-300 !border-white/50 hover:!border-yellow-400 !rounded-full !px-5 !h-12 !bg-black/30 hover:!bg-black/40 shadow-md transition-all font-semibold flex items-center gap-1.5"
        >
          Lặp lại
        </Button>

        <Button
          type="primary"
          size="large"
          onClick={handleFlip}
          icon={<RotateCw size={18} />}
          className="!bg-yellow-400 !text-black !font-bold hover:!bg-yellow-300 !border-none !px-6 !h-12 !rounded-full shadow-lg hover:scale-105 transition-transform flex items-center gap-2"
        >
          Xoay
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
        Vuốt sang trái hoặc phải để chuyển thẻ
      </p>
    </div>
  );
};

export default CardFlipMode;