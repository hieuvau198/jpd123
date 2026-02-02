import React, { useState, useEffect } from 'react';
import { Card, Button, Typography, Flex, Result, message } from 'antd';
import { ArrowLeft, CheckCircle } from 'lucide-react';

const { Title, Text } = Typography;

// --- UTILS ---
const shuffleArray = (array) => {
  const newArr = [...array];
  for (let i = newArr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArr[i], newArr[j]] = [newArr[j], newArr[i]];
  }
  return newArr;
};

const MatchingSession = ({ data, onHome, onBack }) => {
  const [gameItems, setGameItems] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [matchedIds, setMatchedIds] = useState(new Set());
  const [isProcessing, setIsProcessing] = useState(false);

  // Initialize Game
  useEffect(() => {
    if (data && data.questions) {
      // 1. Pick 5 random questions (or fewer if data has < 5)
      const allQuestions = shuffleArray([...data.questions]);
      const selectedQuestions = allQuestions.slice(0, 5);

      // 2. Create pairs (Question Card & Answer Card)
      const deck = [];
      selectedQuestions.forEach(q => {
        // Card for Question (English)
        deck.push({
          uid: `q-${q.id}`,
          pairId: q.id,
          content: q.speak || q.question, // Prefer 'speak' field if available for cleaner text
          type: 'question'
        });
        
        // Card for Answer (Vietnamese)
        deck.push({
          uid: `a-${q.id}`,
          pairId: q.id,
          content: q.answer,
          type: 'answer'
        });
      });

      // 3. Shuffle the deck of 10 cards
      setGameItems(shuffleArray(deck));
      setMatchedIds(new Set());
      setSelectedIds([]);
    }
  }, [data]);

  const handleCardClick = (uid) => {
    // Ignore if processing, already matched, or clicked same card twice
    if (isProcessing || matchedIds.has(uid) || selectedIds.includes(uid)) return;

    const newSelected = [...selectedIds, uid];
    setSelectedIds(newSelected);

    // If 2 cards selected, check match
    if (newSelected.length === 2) {
      setIsProcessing(true);
      
      const card1 = gameItems.find(item => item.uid === newSelected[0]);
      const card2 = gameItems.find(item => item.uid === newSelected[1]);

      if (card1.pairId === card2.pairId) {
        // Match found!
        message.success("Matched!");
        setTimeout(() => {
            setMatchedIds(prev => new Set([...prev, card1.uid, card2.uid]));
            setSelectedIds([]);
            setIsProcessing(false);
        }, 300); // Short delay to see the second selection
      } else {
        // No match
        setTimeout(() => {
            setSelectedIds([]);
            setIsProcessing(false);
        }, 1000); // 1s delay to memorize mistake
      }
    }
  };

  // --- WIN CONDITION ---
  if (gameItems.length > 0 && matchedIds.size === gameItems.length) {
    return (
      <Flex justify="center" align="center" style={{ minHeight: '80vh' }}>
        <Result
          status="success"
          icon={<CheckCircle size={60} color="#52c41a" />}
          title="Great Job!"
          subTitle="You matched all pairs correctly."
          extra={[
            <Button key="home" onClick={onHome}>Home</Button>,
            <Button key="restart" type="primary" onClick={() => {
               // Re-trigger init by clearing then setting items (or just force remount in parent)
               // Simple way: call onBack then user clicks matching again, or we duplicate logic.
               // Let's reuse the shuffle logic by forcing a re-mount via key or state reset:
               setMatchedIds(new Set());
               setSelectedIds([]);
               // Reshuffle logic needs to run again. 
               // Quickest way: just call the init logic again or simple reload:
               const allQuestions = shuffleArray([...data.questions]);
               const selectedQuestions = allQuestions.slice(0, 5);
               const deck = [];
               selectedQuestions.forEach(q => {
                 deck.push({ uid: `q-${q.id}`, pairId: q.id, content: q.speak || q.question, type: 'question' });
                 deck.push({ uid: `a-${q.id}`, pairId: q.id, content: q.answer, type: 'answer' });
               });
               setGameItems(shuffleArray(deck));
            }}>Play Again</Button>,
          ]}
        />
      </Flex>
    );
  }

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: 20 }}>
      {/* HEADER */}
      <Flex justify="space-between" align="center" style={{ marginBottom: 20 }}>
        <Button icon={<ArrowLeft size={16} />} onClick={onBack}>Back</Button>
        <Text strong>Match the pairs</Text>
        <div style={{ width: 60 }} /> {/* Spacer for centering */}
      </Flex>

      {/* GRID */}
      <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', 
          gap: 16 
      }}>
        {gameItems.map((item) => {
            const isSelected = selectedIds.includes(item.uid);
            const isMatched = matchedIds.has(item.uid);

            // If matched, we can hide it or show it as 'done'. 
            // "Cards disappear" request -> opacity 0 or visibility hidden
            const style = isMatched ? { opacity: 0, pointerEvents: 'none' } : {};

            return (
                <Card 
                    key={item.uid}
                    hoverable={!isMatched}
                    onClick={() => handleCardClick(item.uid)}
                    style={{ 
                        ...style,
                        height: 120, 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        textAlign: 'center',
                        border: isSelected ? '2px solid #1890ff' : '1px solid #d9d9d9',
                        background: isSelected ? '#e6f7ff' : '#fff',
                        transition: 'all 0.3s',
                        cursor: isMatched ? 'default' : 'pointer'
                    }}
                >
                    <Text strong style={{ fontSize: 16 }}>
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