import React, { useState, useEffect } from 'react';
import { Card, Button, Typography, Flex, Result, message, Progress } from 'antd';
import { ArrowLeft, Trophy } from 'lucide-react';
import { ALL_LEVELS, getRatingInfo } from './flashcardConstants';
import SessionResult from '../SessionResult';

const { Title, Text } = Typography;

const SECTION_SIZE = 5;

const CARD_COLORS = [
  '#FF9AA2', '#FFB7B2', '#FFDAC1', '#E2F0CB', '#B5EAD7', 
  '#C7CEEA', '#90CCF4', '#F3D250', '#F78888', '#93B5C6', 
];

const shuffleArray = (array) => {
  const newArr = [...array];
  for (let i = newArr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArr[i], newArr[j]] = [newArr[j], newArr[i]];
  }
  return newArr;
};

const MatchingSession = ({ data, onHome, onBack }) => {
  const [allQuestions, setAllQuestions] = useState([]); 
  const [sectionIndex, setSectionIndex] = useState(0);  
  
  const [gameItems, setGameItems] = useState([]);       
  const [selectedIds, setSelectedIds] = useState([]);   
  const [matchedIds, setMatchedIds] = useState(new Set()); 
  const [isProcessing, setIsProcessing] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  
  // Track pairs the user mismatched at least once
  const [wrongPairIds, setWrongPairIds] = useState(new Set());

  useEffect(() => {
    if (data && data.questions) {
      setAllQuestions(shuffleArray([...data.questions]));
      setSectionIndex(0);
      setIsFinished(false);
      setWrongPairIds(new Set());
    }
  }, [data]);

  useEffect(() => {
    if (allQuestions.length === 0) return;

    const startIndex = sectionIndex * SECTION_SIZE;
    
    if (startIndex >= allQuestions.length) {
      setIsFinished(true);
      return;
    }

    const currentBatch = allQuestions.slice(startIndex, startIndex + SECTION_SIZE);
    
    const deck = [];
    currentBatch.forEach(q => {
      deck.push({
        uid: `q-${q.id}`,
        pairId: q.id,
        content: q.question || q.question,
        type: 'question'
      });
      deck.push({
        uid: `a-${q.id}`,
        pairId: q.id,
        content: q.answer,
        type: 'answer'
      });
    });

    const shuffledDeck = shuffleArray(deck).map(item => ({
        ...item,
        bgColor: CARD_COLORS[Math.floor(Math.random() * CARD_COLORS.length)]
    }));

    setGameItems(shuffledDeck);
    setMatchedIds(new Set());
    setSelectedIds([]);
    setIsProcessing(false);

  }, [sectionIndex, allQuestions]);

  const handleSpeech = (text) => {
    if (!text) return;
    if ('speechSynthesis' in window) {
      const synth = window.speechSynthesis;
      if (synth.speaking) synth.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'en-US';
      utterance.rate = 0.9;
      synth.speak(utterance);
    }
  };

  const handleCardClick = (uid) => {
    if (isProcessing || matchedIds.has(uid) || selectedIds.includes(uid)) return;

    const newSelected = [...selectedIds, uid];
    setSelectedIds(newSelected);

    if (newSelected.length === 1) {
       const firstCard = gameItems.find(item => item.uid === newSelected[0]);
       if (firstCard.type === 'question') {
           handleSpeech(firstCard.content);
       }
    }

    if (newSelected.length === 2) {
      setIsProcessing(true);
      
      const card1 = gameItems.find(item => item.uid === newSelected[0]);
      const card2 = gameItems.find(item => item.uid === newSelected[1]);

      const qCard = [card1, card2].find(c => c.type === 'question');
      let textToSpeak = qCard ? qCard.content : '';
      if (!textToSpeak) {
          const fallbackQ = gameItems.find(item => item.pairId === card2.pairId && item.type === 'question');
          if (fallbackQ) textToSpeak = fallbackQ.content;
      }

      if (card1.pairId === card2.pairId) {
        // MATCH
        handleSpeech(textToSpeak); 
        const newMatched = new Set([...matchedIds, card1.uid, card2.uid]);
        setMatchedIds(newMatched);
        setSelectedIds([]);
        setIsProcessing(false);

        if (newMatched.size === gameItems.length) {
            handleSectionComplete();
        }

      } else {
        // NO MATCH -> Flag these items as incorrectly guessed
        setWrongPairIds(prev => new Set(prev).add(card1.pairId).add(card2.pairId));

        handleSpeech(textToSpeak); 
        setTimeout(() => {
            setSelectedIds([]);
            setIsProcessing(false);
        }, 800);
      }
    }
  };

  const handleSectionComplete = () => {
     message.success("Section Complete! Moving to next...");
     setTimeout(() => {
         setSectionIndex(prev => prev + 1);
     }, 1000);
  };

  if (isFinished) {
  const score = Math.max(0, Math.round(((allQuestions.length - wrongPairIds.size) / allQuestions.length) * 100));
  
  return (
    <SessionResult 
      score={score}
      onBack={onBack}
      onRestart={() => {
        setAllQuestions(shuffleArray([...data.questions]));
        setSectionIndex(0);
        setWrongPairIds(new Set());
        setIsFinished(false);
      }}
    />
  );
}

  const totalSections = Math.ceil(allQuestions.length / SECTION_SIZE);
  const progressPercent = Math.round((sectionIndex / totalSections) * 100);

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto', padding: 20 }}>
      <Flex justify="space-between" align="center" style={{ marginBottom: 20 }}>
        <Button icon={<ArrowLeft size={16} />} onClick={onBack}>Back</Button>
        
        <div style={{ flex: 1, maxWidth: 300, margin: '0 20px' }}>
            <Flex vertical align="center">
                <Text strong>Section {sectionIndex + 1} / {totalSections}</Text>
                <Progress percent={progressPercent} showInfo={false} size="small" status="active" />
            </Flex>
        </div>

        <Button type="text" disabled>
            {matchedIds.size / 2} / {gameItems.length / 2} pairs
        </Button>
      </Flex>

      <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', 
          gap: 20 
      }}>
        {gameItems.map((item) => {
            const isSelected = selectedIds.includes(item.uid);
            const isMatched = matchedIds.has(item.uid);

            const style = isMatched ? { 
                opacity: 0, 
                pointerEvents: 'none', 
                transform: 'scale(0.5)' 
            } : {};

            return (
                <Card 
                    key={item.uid}
                    hoverable={!isMatched}
                    onClick={() => handleCardClick(item.uid)}
                    bordered={false}
                    style={{ 
                        ...style,
                        height: 160, 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        textAlign: 'center',
                        background: item.bgColor,
                        border: isSelected ? '3px solid #000' : 'none',
                        transform: isSelected ? 'scale(1.05)' : 'scale(1)',
                        transition: 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)', 
                        cursor: isMatched ? 'default' : 'pointer',
                        borderRadius: 16,
                        boxShadow: '0 4px 10px rgba(0,0,0,0.1)'
                    }}
                    bodyStyle={{ padding: 10, width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                    <Text strong style={{ 
                        fontSize: '1.2rem', 
                        color: '#333',
                        lineHeight: 1.3
                    }}>
                        {item.content}
                    </Text>
                </Card>
            );
        })}
      </div>
    </div>
  );
};

export default MatchingSession;