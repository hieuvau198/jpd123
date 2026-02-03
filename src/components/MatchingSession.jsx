import React, { useState, useEffect } from 'react';
import { Card, Button, Typography, Flex, Result, message, Progress } from 'antd';
import { ArrowLeft, CheckCircle, Trophy } from 'lucide-react';

const { Title, Text } = Typography;

const SECTION_SIZE = 5;

// --- COLORS ---
const CARD_COLORS = [
  '#FF9AA2', // Light Red
  '#FFB7B2', // Salmon
  '#FFDAC1', // Peach
  '#E2F0CB', // Lime
  '#B5EAD7', // Mint
  '#C7CEEA', // Periwinkle
  '#90CCF4', // Light Blue
  '#F3D250', // Yellow
  '#F78888', // Coral
  '#93B5C6', // Greyish Blue
];

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
  // --- STATE ---
  const [allQuestions, setAllQuestions] = useState([]); // The full queue of words
  const [sectionIndex, setSectionIndex] = useState(0);  // Current section (0, 1, 2...)
  
  const [gameItems, setGameItems] = useState([]);       // The cards currently on screen
  const [selectedIds, setSelectedIds] = useState([]);   // Cards currently selected by user
  const [matchedIds, setMatchedIds] = useState(new Set()); // Cards matched in this section
  const [isProcessing, setIsProcessing] = useState(false);
  const [isFinished, setIsFinished] = useState(false);

  // 1. Initialize & Shuffle Full Deck
  useEffect(() => {
    if (data && data.questions) {
      setAllQuestions(shuffleArray([...data.questions]));
      setSectionIndex(0);
      setIsFinished(false);
    }
  }, [data]);

  // 2. Load Section whenever index or matching resets
  useEffect(() => {
    if (allQuestions.length === 0) return;

    const startIndex = sectionIndex * SECTION_SIZE;
    
    // Check if we are done
    if (startIndex >= allQuestions.length) {
      setIsFinished(true);
      return;
    }

    // Slice the next batch
    const currentBatch = allQuestions.slice(startIndex, startIndex + SECTION_SIZE);
    
    // Prepare Cards for this batch
    const deck = [];
    currentBatch.forEach(q => {
      deck.push({
        uid: `q-${q.id}`,
        pairId: q.id,
        content: q.speak || q.question,
        type: 'question'
      });
      deck.push({
        uid: `a-${q.id}`,
        pairId: q.id,
        content: q.answer,
        type: 'answer'
      });
    });

    // Assign random colors and shuffle
    const shuffledDeck = shuffleArray(deck).map(item => ({
        ...item,
        bgColor: CARD_COLORS[Math.floor(Math.random() * CARD_COLORS.length)]
    }));

    setGameItems(shuffledDeck);
    setMatchedIds(new Set());
    setSelectedIds([]);
    setIsProcessing(false);

  }, [sectionIndex, allQuestions]);

  // 3. Card Click Handler
  const handleCardClick = (uid) => {
    if (isProcessing || matchedIds.has(uid) || selectedIds.includes(uid)) return;

    const newSelected = [...selectedIds, uid];
    setSelectedIds(newSelected);

    // If 2 cards selected, check match
    if (newSelected.length === 2) {
      setIsProcessing(true);
      
      const card1 = gameItems.find(item => item.uid === newSelected[0]);
      const card2 = gameItems.find(item => item.uid === newSelected[1]);

      if (card1.pairId === card2.pairId) {
        // MATCH
        const newMatched = new Set([...matchedIds, card1.uid, card2.uid]);
        setMatchedIds(newMatched);
        setSelectedIds([]);
        setIsProcessing(false);

        // Check if section complete
        if (newMatched.size === gameItems.length) {
            handleSectionComplete();
        }

      } else {
        // NO MATCH
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

  // --- FINISHED SCREEN ---
  if (isFinished) {
    return (
      <Flex justify="center" align="center" style={{ minHeight: '80vh' }}>
        <Result
          status="success"
          icon={<Trophy size={80} color="#ffec3d" style={{ filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.2))' }} />}
          title="All Sections Completed!"
          subTitle={`You successfully matched all ${allQuestions.length} pairs.`}
          extra={[
            <Button key="home" onClick={onHome}>Home</Button>,
            <Button key="restart" type="primary" onClick={() => {
               setAllQuestions(shuffleArray([...data.questions]));
               setSectionIndex(0);
               setIsFinished(false);
            }}>Play Again</Button>,
          ]}
        />
      </Flex>
    );
  }

  // Calculate Progress
  const totalSections = Math.ceil(allQuestions.length / SECTION_SIZE);
  const progressPercent = Math.round((sectionIndex / totalSections) * 100);

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto', padding: 20 }}>
      {/* HEADER */}
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

      {/* GRID */}
      <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', // BIGGER COLUMNS
          gap: 20 // MORE SPACE
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
                        height: 160, // BIGGER HEIGHT
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        textAlign: 'center',
                        
                        // Dynamic Color Background
                        background: item.bgColor,
                        
                        // Selection State: Thick Black Border + Scale
                        border: isSelected ? '3px solid #000' : 'none',
                        transform: isSelected ? 'scale(1.05)' : 'scale(1)',
                        
                        transition: 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)', // Bouncy transition
                        cursor: isMatched ? 'default' : 'pointer',
                        borderRadius: 16,
                        boxShadow: '0 4px 10px rgba(0,0,0,0.1)'
                    }}
                    bodyStyle={{ padding: 10, width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                    <Text strong style={{ 
                        fontSize: '1.2rem', // BIGGER FONT
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