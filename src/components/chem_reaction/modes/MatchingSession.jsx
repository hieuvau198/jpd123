import React, { useState, useEffect } from 'react';
import { Card, Button, Typography, Flex } from 'antd';
import { ArrowLeft } from 'lucide-react';
import SessionResult from '../../SessionResult'; // Adjust the path if necessary

// Import KaTeX for rendering chemical formulas
import 'katex/dist/katex.min.css';
import { InlineMath } from 'react-katex';

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

// Robust helper to split complex chemical formulas (Handles nested LaTeX braces like \text{})
const splitFormula = (formula) => {
  if (!formula) return { left: '', right: '', arrow: '\\rightarrow' };

  // Find the start of the arrow command
  const arrowMatch = formula.match(/(\\xrightarrow|\\rightarrow|\\rightleftharpoons)/);
  if (!arrowMatch) return { left: formula, right: '', arrow: '\\rightarrow' };

  const arrowCmd = arrowMatch[0];
  const arrowIndex = arrowMatch.index;

  let left = formula.substring(0, arrowIndex).trim();
  let rightStr = formula.substring(arrowIndex);
  
  let arrowFull = arrowCmd;
  let right = rightStr.substring(arrowCmd.length);

  // If it's xrightarrow, intelligently parse until the closing brace
  if (arrowCmd === '\\xrightarrow' && right.startsWith('{')) {
    let braceCount = 0;
    let i = 0;
    for (; i < right.length; i++) {
      if (right[i] === '{') braceCount++;
      if (right[i] === '}') braceCount--;
      if (braceCount === 0) break;
    }
    arrowFull += right.substring(0, i + 1);
    right = right.substring(i + 1);
  }

  return {
    left: left,
    right: right.trim() || formula,
    arrow: arrowFull
  };
};

const MatchingSession = ({ data, onBack }) => {
  const [allReactions, setAllReactions] = useState([]); 
  const [sectionIndex, setSectionIndex] = useState(0);  
  
  const [gameItems, setGameItems] = useState([]);       
  const [selectedIds, setSelectedIds] = useState([]);   
  const [matchedIds, setMatchedIds] = useState(new Set()); 
  const [isProcessing, setIsProcessing] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  
  // Track pairs the user mismatched at least once to calculate the score
  const [wrongPairIds, setWrongPairIds] = useState(new Set());

  useEffect(() => {
    if (data && data.reactions) {
      setAllReactions(shuffleArray([...data.reactions]));
      setSectionIndex(0);
      setIsFinished(false);
      setWrongPairIds(new Set());
    }
  }, [data]);

  useEffect(() => {
    if (allReactions.length === 0) return;

    const startIndex = sectionIndex * SECTION_SIZE;
    
    if (startIndex >= allReactions.length) {
      setIsFinished(true);
      return;
    }

    const currentBatch = allReactions.slice(startIndex, startIndex + SECTION_SIZE);
    
    const deck = [];
    currentBatch.forEach(reaction => {
      const { left, right } = splitFormula(reaction.formula);

      deck.push({
        uid: `left-${reaction.id}`,
        pairId: reaction.id,
        content: left,
        type: 'left'
      });
      deck.push({
        uid: `right-${reaction.id}`,
        pairId: reaction.id,
        content: right,
        type: 'right'
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

  }, [sectionIndex, allReactions]);

  const handleCardClick = (uid) => {
    if (isProcessing || matchedIds.has(uid) || selectedIds.includes(uid)) return;

    const newSelected = [...selectedIds, uid];
    setSelectedIds(newSelected);

    if (newSelected.length === 2) {
      setIsProcessing(true);
      
      const card1 = gameItems.find(item => item.uid === newSelected[0]);
      const card2 = gameItems.find(item => item.uid === newSelected[1]);

      if (card1.pairId === card2.pairId) {
        // MATCH!
        const newMatched = new Set([...matchedIds, card1.uid, card2.uid]);
        setMatchedIds(newMatched);
        setSelectedIds([]);
        setIsProcessing(false);

        if (newMatched.size === gameItems.length) {
            handleSectionComplete();
        }

      } else {
        // NO MATCH -> Flag these items as incorrectly guessed for scoring
        setWrongPairIds(prev => new Set(prev).add(card1.pairId).add(card2.pairId));

        setTimeout(() => {
            setSelectedIds([]);
            setIsProcessing(false);
        }, 800);
      }
    }
  };

  const handleSectionComplete = () => {
     setTimeout(() => {
         setSectionIndex(prev => prev + 1);
     }, 1000);
  };

  if (isFinished) {
    const score = Math.max(0, Math.round(((allReactions.length - wrongPairIds.size) / allReactions.length) * 100));
    
    return (
      <SessionResult 
        score={score}
        resultMessage={`"${data?.title || 'Chemistry'}": Matched ${allReactions.length} reactions!`}
        onBack={onBack}
        onRestart={() => {
          setAllReactions(shuffleArray([...data.reactions]));
          setSectionIndex(0);
          setWrongPairIds(new Set());
          setIsFinished(false);
        }}
        practiceId={data.id} 
        practiceType="Chem Quiz" // Aligns with your mission tracking
      />
    );
  }

  // Helper function to render content gracefully
  const renderContent = (content) => {
    if (!content) return "";
    return <InlineMath math={content} errorColor="#cc0000" />;
  };

  return (
    <div className="mt-8" style={{ maxWidth: 1000, margin: '0 auto', padding: 20 }}>
      {/* Header controls */}
      <Flex justify="space-between" align="center" style={{ marginBottom: 20, marginTop: 30 }}>
        <Button icon={<ArrowLeft size={20} />} onClick={onBack} />
        <Button type="text" disabled style={{ color: 'white' }}>
            {matchedIds.size / 2} / {gameItems.length / 2}
        </Button>
      </Flex>

      {/* Grid container */}
      <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
          gap: 16 // Slightly increased gap for visual breathing room
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
                        minHeight: 140, // Changed from fixed height to minHeight to allow growth
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        textAlign: 'center',
                        background: item.bgColor,
                        border: isSelected ? '3px solid #000' : '3px solid transparent', // Prevent layout shift on border
                        transform: isSelected ? 'scale(1.05)' : 'scale(1)',
                        transition: 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)', 
                        cursor: isMatched ? 'default' : 'pointer',
                        borderRadius: 16,
                        boxShadow: '0 4px 10px rgba(0,0,0,0.1)'
                    }}
                    bodyStyle={{ 
                        padding: 12, 
                        width: '100%', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        overflowWrap: 'anywhere' // Ensure long strings break if necessary
                    }}
                >
                    <div style={{ 
                        fontSize: '1.2rem', // Adjusted for better fit of long formulas
                        color: '#333',
                        fontWeight: 'bold',
                        lineHeight: 1.4, // Improved readability for multiline formulas
                        width: '100%'
                    }}>
                        {renderContent(item.content)}
                    </div>
                </Card>
            );
        })}
      </div>
    </div>
  );
};

export default MatchingSession;