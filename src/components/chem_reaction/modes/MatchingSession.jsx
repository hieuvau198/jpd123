import React, { useState, useEffect } from 'react';
import { Card, Button, Typography, Flex, Progress } from 'antd';
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

// Helper to split the chemical formula into left (Reactants) and right (Products) sides
const splitFormula = (formula) => {
  if (!formula) return { left: '', right: '' };
  
  // Splits by typical LaTeX reaction arrows: \rightarrow, \xrightarrow{...}, or \rightleftharpoons
  const parts = formula.split(/\\x?rightarrow(?:\{[^}]*\})?|\\rightleftharpoons|\\rightarrow/);
  
  return {
    left: parts[0] ? parts[0].trim() : '',
    right: parts[1] ? parts[1].trim() : formula 
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

  const totalSections = Math.ceil(allReactions.length / SECTION_SIZE);
  const progressPercent = Math.round((sectionIndex / totalSections) * 100);

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto', padding: 20 }}>
      <Flex justify="space-between" align="center" style={{ marginBottom: 20, marginTop: 30 }}>
        <Button icon={<ArrowLeft size={20} />} onClick={onBack} />
        
        <div style={{ flex: 1, maxWidth: 300, margin: '0 20px' }}>
            <Flex vertical align="center">
                <Text strong style={{ color: 'white' }}>Section {sectionIndex + 1} / {totalSections}</Text>
                <Progress percent={progressPercent} showInfo={false} size="small" status="active" />
            </Flex>
        </div>

        <Button type="text" disabled style={{ color: 'white' }}>
            {matchedIds.size / 2} / {gameItems.length / 2} pairs
        </Button>
      </Flex>

      <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', 
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
                    <div style={{ 
                        fontSize: '1.4rem', // Slightly larger font for formulas
                        color: '#333',
                        fontWeight: 'bold'
                    }}>
                        {/* Render using KaTeX InlineMath */}
                        <InlineMath math={item.content || ""} />
                    </div>
                </Card>
            );
        })}
      </div>
    </div>
  );
};

export default MatchingSession;