// src/components/flashcard/FlashcardSession.jsx
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Button, Typography, Flex, Tooltip, Badge } from 'antd';
import { ArrowLeft, Shuffle, Bookmark, RotateCcw } from 'lucide-react';
import FlashcardTypeBSelector from './view/FlashcardTypeBSelector';
import FlashcardCard from './view/FlashcardCard';
import FlashcardControls from './view/FlashcardControls';

const { Title } = Typography;

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
  const [flaggedKeys, setFlaggedKeys] = useState(new Set());

  // EXACT same speak implementation as TypeBMCSession
  const speakWord = useCallback((text) => {
    if (!text || typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'en-US';
      utterance.rate = 0.9;
      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.warn("Speech error:", e);
    }
  }, []);

  useEffect(() => {
    return () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const buildCardsList = () => {
    if (!data) return [];
    if (isTypeB) {
      const result = [];
      const rawWords = data.words || [];
      rawWords.forEach((item, idx) => {
        const baseKey = `w-${idx}-${item.word}`;
        if (selectedTypes.words && item.word) {
          const meaning = item.defs && item.defs.length > 0
            ? item.defs.map(d => d.m).join(', ')
            : (item.answer || '');
          result.push({
            id: `${baseKey}-main`,
            cardKey: `${baseKey}-main`,
            front: item.word,
            back: meaning,
            ipa: item.ipa || '',
            tag: 'Từ chính',
          });
        }
        if (selectedTypes.phrases && Array.isArray(item.phrases)) {
          item.phrases.forEach((p, pIdx) => {
            result.push({
              id: `${baseKey}-phrase-${pIdx}`,
              cardKey: `${baseKey}-phrase-${pIdx}`,
              front: p.text,
              back: p.m,
              tag: 'Cụm từ',
            });
          });
        }
        if (selectedTypes.sentences && Array.isArray(item.sentences)) {
          item.sentences.forEach((s, sIdx) => {
            result.push({
              id: `${baseKey}-sentence-${sIdx}`,
              cardKey: `${baseKey}-sentence-${sIdx}`,
              front: s.text,
              back: s.m,
              tag: 'Câu',
            });
          });
        }
      });
      return result;
    }

    const rawQuestions = data.questions || [];
    return rawQuestions.map((q, idx) => ({
      id: q.id || `q-${idx}`,
      cardKey: String(q.id || `q-${idx}`),
      front: q.question || q.word,
      back: q.answer || q.meaning,
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

  // Speak the exact word displayed on the front of the card
  useEffect(() => {
    if (isConfigured && cards[currentIndex]) {
      speakWord(cards[currentIndex].front);
    }
  }, [currentIndex, isConfigured, cards, speakWord]);

  const handleFlip = () => setIsFlipped(prev => !prev);

  // Manual volume click speaks the exact word displayed on the card
  const handleManualSpeech = () => {
    if (cards[currentIndex]) {
      speakWord(cards[currentIndex].front);
    }
  };

  const handleToggleFlag = () => {
    if (!cards.length) return;
    const currentCard = cards[currentIndex];
    const key = currentCard.cardKey;
    const isAlreadyFlagged = flaggedKeys.has(key);
    if (isAlreadyFlagged) {
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
      setFlaggedKeys(prev => new Set(prev).add(key));
      setCards(prevCards => {
        const updated = [...prevCards];
        const clone = { ...currentCard, id: `${key}-repeat-${Date.now()}` };
        const insertPos = Math.min(currentIndex + 6, updated.length);
        updated.splice(insertPos, 0, clone);
        return updated;
      });
    }
  };

  const handleNext = () => {
    if (currentIndex < cards.length - 1) {
      const currentCard = cards[currentIndex];
      if (flaggedKeys.has(currentCard.cardKey)) {
        setCards(prevCards => {
          const updated = [...prevCards];
          const hasPendingAhead = updated.slice(currentIndex + 1).some(c => c.cardKey === currentCard.cardKey);
          if (!hasPendingAhead) {
            const clone = { ...currentCard, id: `${currentCard.cardKey}-repeat-${Date.now()}` };
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
    return (
      <FlashcardTypeBSelector
        selectedTypes={selectedTypes}
        onChangeTypes={setSelectedTypes}
        onStart={handleStartPractice}
        onBack={onBack}
      />
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
    <div className="max-w-2xl mx-auto py-8 px-4 mt-8">
      <Flex justify="space-between" align="center" className="mb-8">
        <Button
          icon={<ArrowLeft size={18} />}
          onClick={onBack}
          className="rounded-full bg-black/40 hover:bg-black/60 text-white/90 shadow-md border border-white/10 font-medium backdrop-blur-md"
        />

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

        <Flex gap="small">
          <Tooltip title="Thứ tự gốc">
            <Button
              shape="circle"
              icon={<RotateCcw size={16} />}
              onClick={handleResetOrder}
              className="bg-black/40 hover:bg-black/60 border border-white/10 text-white/80 shadow-sm backdrop-blur-md"
            />
          </Tooltip>
          <Tooltip title="Xáo trộn">
            <Button
              shape="circle"
              icon={<Shuffle size={16} />}
              onClick={handleReshuffle}
              className="bg-black/40 hover:bg-black/60 border border-white/10 text-cyan-400 shadow-sm backdrop-blur-md hover:text-cyan-300"
            />
          </Tooltip>
        </Flex>
      </Flex>

      <FlashcardCard
        currentCard={currentCard}
        isFlipped={isFlipped}
        isFlagged={isCurrentFlagged}
        onFlip={handleFlip}
        onManualSpeech={handleManualSpeech}
      />

      <FlashcardControls
        currentIndex={currentIndex}
        totalCards={cards.length}
        isFlagged={isCurrentFlagged}
        onPrev={handlePrev}
        onFlip={handleFlip}
        onToggleFlag={handleToggleFlag}
        onNext={handleNext}
      />
    </div>
  );
};

export default FlashcardSession;