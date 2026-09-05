import React, { useState, useEffect, useMemo } from 'react';
import { Button, Typography, Flex, Checkbox, Card, Tooltip, Badge } from 'antd';
import { 
  ArrowLeft, 
  ArrowRight, 
  RotateCw, 
  Volume2, 
  Layers, 
  Shuffle,
  Bookmark,
  BookmarkCheck,
  RotateCcw
} from 'lucide-react';

const { Title, Text } = Typography;

const shuffleArray = (array) => {
  const newArr = [...array];
  for (let i = newArr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArr[i], newArr[j]] = [newArr[j], newArr[i]];
  }
  return newArr;
};

const FlashcardSession = ({ data, onBack }) => {
  const isTypeB = useMemo(() => {
    return data?.type === 'flashcard-b' || (Array.isArray(data?.words) && data.words.length > 0);
  }, [data]);

  const [selectedTypes, setSelectedTypes] = useState({
    words: true,
    phrases: false,
    sentences: false,
  });
  const [isConfigured, setIsConfigured] = useState(!isTypeB);
  const [cards, setCards] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  // Set of flagged card keys: persistently tracked until manually removed
  const [flaggedKeys, setFlaggedKeys] = useState(new Set());

  // Generate cards in original sequential order
  const buildCardsList = () => {
    if (!data) return [];
    if (isTypeB) {
      const result = [];
      const rawWords = data.words || [];
      rawWords.forEach((item, idx) => {
        const baseKey = `w-${idx}-${item.word}`;

        // Parent word
        if (selectedTypes.words && item.word) {
          const meaning = item.defs && item.defs.length > 0
            ? item.defs.map(d => d.m).join(', ')
            : (item.answer || '');
          result.push({
            id: `${baseKey}-main`,
            cardKey: `${baseKey}-main`,
            front: item.word,
            back: meaning,
            speak: item.word,
            ipa: item.ipa || '',
            tag: 'Từ vựng',
          });
        }
        // Phrases under this word
        if (selectedTypes.phrases && Array.isArray(item.phrases)) {
          item.phrases.forEach((p, pIdx) => {
            result.push({
              id: `${baseKey}-phrase-${pIdx}`,
              cardKey: `${baseKey}-phrase-${pIdx}`,
              front: p.text,
              back: p.m,
              speak: p.text,
              tag: 'Cụm từ',
            });
          });
        }
        // Sentences under this word
        if (selectedTypes.sentences && Array.isArray(item.sentences)) {
          item.sentences.forEach((s, sIdx) => {
            result.push({
              id: `${baseKey}-sentence-${sIdx}`,
              cardKey: `${baseKey}-sentence-${sIdx}`,
              front: s.text,
              back: s.m,
              speak: s.text,
              tag: 'Câu ví dụ',
            });
          });
        }
      });
      return result;
    }

    // Default flashcard format
    const rawQuestions = data.questions || [];
    return rawQuestions.map((q, idx) => ({
      id: q.id || `q-${idx}`,
      cardKey: String(q.id || `q-${idx}`),
      front: q.question || q.word,
      back: q.answer || q.meaning,
      speak: q.speak || q.question || q.word,
      ipa: q.ipa || '',
      tag: 'Flashcard',
    }));
  };

  const handleStartPractice = () => {
    const list = buildCardsList();
    if (list.length === 0) return;
    setCards(list);
    setCurrentIndex(0);
    setIsFlipped(false);
    setFlaggedKeys(new Set());
    setIsConfigured(true);
  };

  useEffect(() => {
    if (!isTypeB && data) {
      handleStartPractice();
    }
  }, [data, isTypeB]);

  const handleSpeech = (text) => {
    if (!text || typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';
    utterance.rate = 0.9;
    window.speechSynthesis.speak(utterance);
  };

  const handleFlip = () => {
    setIsFlipped(prev => !prev);
  };

  // Toggle 'Học lại' flag
  const handleToggleFlag = () => {
    if (!cards.length) return;
    const currentCard = cards[currentIndex];
    const key = currentCard.cardKey;
    const isAlreadyFlagged = flaggedKeys.has(key);

    if (isAlreadyFlagged) {
      // Manual unflag: remove from active set and delete remaining queued repetitions
      setFlaggedKeys(prev => {
        const next = new Set(prev);
        next.delete(key);
        return next;
      });

      setCards(prevCards => {
        const current = prevCards[currentIndex];
        const ahead = prevCards.slice(currentIndex + 1).filter(c => c.cardKey !== key);
        const behind = prevCards.slice(0, currentIndex);
        return [...behind, current, ...ahead];
      });
    } else {
      // Flag: mark it and schedule first repeat in next 5 cards
      setFlaggedKeys(prev => new Set(prev).add(key));
      setCards(prevCards => {
        const updated = [...prevCards];
        const clone = {
          ...currentCard,
          id: `${key}-repeat-${Date.now()}`
        };
        const insertPos = Math.min(currentIndex + 6, updated.length);
        updated.splice(insertPos, 0, clone);
        return updated;
      });
    }
  };

  // Move Next: auto re-queue flagged card 5 cards ahead if it is still marked for repeat
  const handleNext = () => {
    if (currentIndex < cards.length - 1) {
      const currentCard = cards[currentIndex];
      const isCardFlagged = flaggedKeys.has(currentCard.cardKey);

      if (isCardFlagged) {
        setCards(prevCards => {
          const updated = [...prevCards];
          const hasPendingAhead = updated.slice(currentIndex + 1).some(c => c.cardKey === currentCard.cardKey);
          
          // Re-insert 5 cards ahead if no duplicate is already positioned forward
          if (!hasPendingAhead) {
            const clone = {
              ...currentCard,
              id: `${currentCard.cardKey}-repeat-${Date.now()}`
            };
            const insertPos = Math.min(currentIndex + 6, updated.length);
            updated.splice(insertPos, 0, clone);
          }
          return updated;
        });
      }

      setIsFlipped(false);
      setCurrentIndex(prev => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setIsFlipped(false);
      setCurrentIndex(prev => prev - 1);
    }
  };

  const handleReshuffle = () => {
    if (!cards.length) return;
    setCards(shuffleArray([...cards]));
    setCurrentIndex(0);
    setIsFlipped(false);
  };

  const handleResetOrder = () => {
    setCards(buildCardsList());
    setCurrentIndex(0);
    setIsFlipped(false);
    setFlaggedKeys(new Set());
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isConfigured || cards.length === 0) return;
      if (e.code === 'Space') {
        e.preventDefault();
        handleFlip();
      } else if (e.code === 'ArrowRight') {
        e.preventDefault();
        handleNext();
      } else if (e.code === 'ArrowLeft') {
        e.preventDefault();
        handlePrev();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isConfigured, currentIndex, cards, flaggedKeys]);

  if (isTypeB && !isConfigured) {
    const isAnySelected = selectedTypes.words || selectedTypes.phrases || selectedTypes.sentences;
    return (
      <div className="max-w-md mx-auto my-14 px-4">
        <Card className="rounded-3xl shadow-2xl border-0 bg-slate-900/90 text-white backdrop-blur-xl text-center p-6 border border-white/10">
          <Layers size={44} className="mx-auto text-cyan-400 mb-10" />
          <Flex vertical gap="middle" className="text-left max-w-xs mx-auto mb-8">
            <Checkbox
              checked={selectedTypes.words}
              onChange={(e) => setSelectedTypes({ ...selectedTypes, words: e.target.checked })}
              className="text-base font-medium text-slate-200"
            >
              Từ vựng chính (Words)
            </Checkbox>
            <Checkbox
              checked={selectedTypes.phrases}
              onChange={(e) => setSelectedTypes({ ...selectedTypes, phrases: e.target.checked })}
              className="text-base font-medium text-slate-200"
            >
              Cụm liên quan (Phrases)
            </Checkbox>
            <Checkbox
              checked={selectedTypes.sentences}
              onChange={(e) => setSelectedTypes({ ...selectedTypes, sentences: e.target.checked })}
              className="text-base font-medium text-slate-200"
            >
              Câu hoàn chỉnh (Sentences)
            </Checkbox>
          </Flex>
          <br />
          <Flex justify="center" gap="middle">
            <Button size="large" onClick={onBack} className="rounded-xl px-6 bg-white/10 text-white border-0 hover:bg-white/20">
              Quay lại
            </Button>
            <Button
              type="primary"
              size="large"
              disabled={!isAnySelected}
              onClick={handleStartPractice}
              className="rounded-xl px-8 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold border-0"
            >
              Bắt đầu
            </Button>
          </Flex>
        </Card>
      </div>
    );
  }

  if (cards.length === 0) {
    return (
      <div className="text-center py-20">
        <Title level={4} className="text-white">Không tìm thấy thẻ nào!</Title>
        <Button onClick={onBack} className="mt-4 rounded-xl">Quay lại</Button>
      </div>
    );
  }

  const currentCard = cards[currentIndex];
  const isCurrentFlagged = flaggedKeys.has(currentCard.cardKey);

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      {/* Top Header Controls Bar */}
      <Flex justify="space-between" align="center" className="mb-8">
        <Button 
          icon={<ArrowLeft size={18} />} 
          onClick={onBack}
          className="rounded-full bg-black/40 hover:bg-black/60 text-white/90 shadow-md border border-white/10 font-medium backdrop-blur-md"
        >
          Thoát
        </Button>

        {/* Progress & Flag Counter Badges */}
        <Flex align="center" gap="small">
          <Badge 
            count={flaggedKeys.size} 
            overflowCount={99}
            style={{ backgroundColor: '#f59e0b', color: '#fff', fontWeight: 600 }}
          >
            <div className="bg-white/85 backdrop-blur-md px-3 py-1 rounded-full text-xs font-semibold text-amber-700 flex items-center gap-1 border border-amber-200">
              <Bookmark size={13} className="fill-amber-500 text-amber-500" />
              <span>Ghi nhớ</span>
            </div>
          </Badge>

          <span className="bg-black/40 backdrop-blur-md px-3.5 py-1.5 rounded-full text-xs font-semibold text-white/90 border border-white/10">
            {currentIndex + 1} / {cards.length}
          </span>

          {currentCard.tag && (
            <span className="bg-indigo-600/80 backdrop-blur-md px-3 py-1 rounded-full text-xs font-semibold text-indigo-100 border border-indigo-400/30">
              {currentCard.tag}
            </span>
          )}
        </Flex>

        {/* Action Controls */}
        <Flex gap="small">
          <Tooltip title="Thứ tự mặc định">
            <Button
              shape="circle"
              icon={<RotateCcw size={16} />}
              onClick={handleResetOrder}
              className="bg-black/40 hover:bg-black/60 border border-white/10 text-white/80 shadow-sm backdrop-blur-md"
            />
          </Tooltip>
          <Tooltip title="Xáo trộn lại toàn bộ">
            <Button
              shape="circle"
              icon={<Shuffle size={16} />}
              onClick={handleReshuffle}
              className="bg-black/40 hover:bg-black/60 border border-white/10 text-cyan-400 shadow-sm backdrop-blur-md hover:text-cyan-300"
            />
          </Tooltip>
        </Flex>
      </Flex>

      {/* 3D Flip Card Container with Enhanced Spacing */}
      <div 
        className="perspective-container select-none mb-8 mt-2"
        style={{ width: '100%', height: 390, cursor: 'pointer' }}
        onClick={handleFlip}
      >
        <div className={`card-inner ${isFlipped ? 'flipped' : ''}`}>
          {/* Modern Front Face */}
          <div 
            className="card-front rounded-3xl p-8 bg-gradient-to-br from-slate-900/90 via-slate-800/95 to-slate-900/95 backdrop-blur-xl shadow-2xl flex flex-col justify-between border border-cyan-500/25 relative overflow-hidden"
          >
            {/* Subtle glow highlight in corner */}
            <div className="absolute top-0 right-0 w-36 h-36 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

            <Flex justify="space-between" align="center" className="relative z-10">
              <div>
                {isCurrentFlagged && (
                  <span className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-400/40">
                    <BookmarkCheck size={13} /> Sẽ lặp lại
                  </span>
                )}
              </div>
              <Button
                type="text"
                shape="circle"
                icon={<Volume2 size={30} className="text-cyan-400 hover:text-cyan-300 hover:scale-110 transition-transform" />}
                onClick={(e) => {
                  e.stopPropagation();
                  handleSpeech(currentCard.speak);
                }}
              />
            </Flex>

            <Flex vertical align="center" justify="center" className="flex-1 px-4 relative z-10">
              <Title level={2} className="!m-0 !text-cyan-300 text-center tracking-tight font-bold drop-shadow-sm">
                {currentCard.front}
              </Title>
              {currentCard.ipa && (
                <Text className="text-slate-400 font-mono text-base mt-2 tracking-wide">
                  /{currentCard.ipa}/
                </Text>
              )}
            </Flex>

            <div className="text-center text-xs text-slate-400 font-medium relative z-10 opacity-75">
              Chạm vào thẻ hoặc nhấn Space để xoay
            </div>
          </div>

          {/* Back Face */}
          <div 
            className="card-back rounded-3xl p-8 bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 text-white shadow-2xl flex flex-col justify-between border border-indigo-500/30 relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-36 h-36 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

            <Flex justify="space-between" align="center" className="relative z-10">
              <div>
                {isCurrentFlagged && (
                  <span className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-400/40">
                    <BookmarkCheck size={13} /> Sẽ lặp lại sau 5 thẻ
                  </span>
                )}
              </div>
              <Button
                type="text"
                shape="circle"
                icon={<Volume2 size={30} className="text-emerald-400 hover:text-emerald-300 hover:scale-110 transition-transform" />}
                onClick={(e) => {
                  e.stopPropagation();
                  handleSpeech(currentCard.speak);
                }}
              />
            </Flex>

            <Flex vertical align="center" justify="center" className="flex-1 px-4 relative z-10">
              <Title level={3} className="!m-0 !text-emerald-400 text-center font-semibold leading-relaxed drop-shadow-sm">
                {currentCard.back}
              </Title>
              
            </Flex>

            <div className="text-center text-xs text-slate-400 font-medium relative z-10 opacity-75">
              Chạm vào thẻ hoặc nhấn Space để xoay lại
            </div>
          </div>
        </div>
      </div>

      {/* Control Buttons Footer */}
      <Flex justify="center" align="center" gap="middle" wrap="wrap">
        <Button
          size="large"
          icon={<ArrowLeft size={18} />}
          onClick={handlePrev}
          disabled={currentIndex === 0}
          className="min-w-[100px] h-12 rounded-2xl bg-black/40 hover:bg-black/60 text-white font-medium border border-white/10 backdrop-blur-md shadow-md"
        >
          Trước
        </Button>

        <Button
          type="primary"
          size="large"
          icon={<RotateCw size={18} />}
          onClick={handleFlip}
          className="min-w-[125px] h-12 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 font-semibold shadow-lg shadow-indigo-500/25 border-0 text-white"
        >
          Xoay
        </Button>

        {/* Học lại (Toggle Flag) Button */}
        <Button
          size="large"
          icon={<Bookmark size={17} className={isCurrentFlagged ? "fill-amber-400 text-amber-400" : ""} />}
          onClick={handleToggleFlag}
          className={`h-12 rounded-2xl font-semibold backdrop-blur-md shadow-md transition-all ${
            isCurrentFlagged 
              ? 'bg-amber-500/25 text-amber-300 border border-amber-400/50 hover:bg-amber-500/35' 
              : 'bg-black/40 text-amber-300/90 border border-white/10 hover:bg-black/60'
          }`}
        >
          {isCurrentFlagged ? 'Bỏ học lại' : 'Học lại'}
        </Button>

        {/* Next Button / Final Card Stop */}
        <Button
          size="large"
          icon={<ArrowRight size={18} />}
          onClick={handleNext}
          disabled={currentIndex === cards.length - 1}
          className="min-w-[100px] h-12 rounded-2xl bg-black/40 hover:bg-black/60 text-white font-medium border border-white/10 backdrop-blur-md shadow-md disabled:opacity-40"
        >
          {currentIndex === cards.length - 1 ? 'Hết thẻ' : 'Tiếp theo'}
        </Button>
      </Flex>
    </div>
  );
};

export default FlashcardSession;