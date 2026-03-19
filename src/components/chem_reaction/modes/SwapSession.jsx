import React, { useState, useEffect } from 'react';
import { Button, Typography, Flex, Progress, message } from 'antd';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import SessionResult from '../../SessionResult';

// Import KaTeX for rendering chemical formulas
import 'katex/dist/katex.min.css';
import { InlineMath, BlockMath } from 'react-katex';

const { Title, Text } = Typography;

// Helper to shuffle arrays randomly
const shuffleArray = (array) => {
  const newArr = [...array];
  for (let i = newArr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArr[i], newArr[j]] = [newArr[j], newArr[i]];
  }
  return newArr;
};

// Helper to split formulas safely
const splitToCompounds = (sideString) => {
  if (!sideString) return [];
  return sideString.split(' + ').map(s => s.trim()).filter(Boolean);
};

const SwapSession = ({ data, onBack }) => {
  const [queue, setQueue] = useState([]);
  const [totalQuestions, setTotalQuestions] = useState(0);
  const [completedCount, setCompletedCount] = useState(0);
  
  const [score, setScore] = useState(0);
  const [isFinished, setIsFinished] = useState(false);

  // Game state for current question
  const [currentQuestionKey, setCurrentQuestionKey] = useState('');
  const [targetLeft, setTargetLeft] = useState([]);
  const [targetRight, setTargetRight] = useState([]);
  const [availableQueue, setAvailableQueue] = useState([]);
  const [selectedSlots, setSelectedSlots] = useState([]); 
  
  const [feedbackStatus, setFeedbackStatus] = useState(null); // 'success' | 'error' | null

  // Initialize and shuffle reactions
  useEffect(() => {
    if (data && data.reactions) {
      const initialQueue = shuffleArray([...data.reactions]).map(r => ({ ...r, needed: 1, attempts: 0 }));
      setQueue(initialQueue);
      setTotalQuestions(initialQueue.length);
      setCompletedCount(0);
      setScore(0);
      setIsFinished(false);
    }
  }, [data]);

  // Setup the current question when the top of the queue changes
  useEffect(() => {
    if (queue.length === 0) return;

    const currentReaction = queue[0];
    const key = `${currentReaction.id}-${currentReaction.attempts}-${currentReaction.needed}`;

    if (key !== currentQuestionKey) {
      setCurrentQuestionKey(key);
      
const parts = currentReaction.formula.split(/\\x?rightarrow(?:\{(?:[^{}]|\{[^{}]*\})*\})?|\\rightleftharpoons/);
      const leftStr = parts[0] || '';
      const rightStr = parts[1] || '';

      const leftCompounds = splitToCompounds(leftStr);
      const rightCompounds = splitToCompounds(rightStr);

      setTargetLeft(leftCompounds);
      setTargetRight(rightCompounds);

      // Create a pool of all compounds to be sorted
      const allCompounds = [...leftCompounds, ...rightCompounds].map((formula, index) => ({
        id: `comp-${index}-${Date.now()}`,
        formula
      }));

      setAvailableQueue(shuffleArray(allCompounds));
      setSelectedSlots(new Array(leftCompounds.length + rightCompounds.length).fill(null));
      
      setFeedbackStatus(null);
    }
  }, [queue, currentQuestionKey]);

  // Handle clicking a compound in the available queue
  const handleSelectFromQueue = (compound) => {
    if (feedbackStatus !== null) return; 

    const firstEmptyIndex = selectedSlots.findIndex(slot => slot === null);
    if (firstEmptyIndex !== -1) {
      const newSlots = [...selectedSlots];
      newSlots[firstEmptyIndex] = compound;
      setSelectedSlots(newSlots);

      setAvailableQueue(prev => prev.filter(c => c.id !== compound.id));
    }
  };

  // Handle clicking a compound that is already in the ordered slots
  const handleDeselectFromSlots = (index) => {
    if (feedbackStatus !== null) return; 
    
    const compoundToReturn = selectedSlots[index];
    if (compoundToReturn) {
      const newSlots = [...selectedSlots];
      newSlots[index] = null;
      setSelectedSlots(newSlots);

      setAvailableQueue(prev => [...prev, compoundToReturn]);
    }
  };

  const handleCheckOrder = () => {
    const userLeft = selectedSlots.slice(0, targetLeft.length).map(c => c.formula);
    const userRight = selectedSlots.slice(targetLeft.length).map(c => c.formula);

    const isLeftCorrect = [...userLeft].sort().join(',') === [...targetLeft].sort().join(',');
    const isRightCorrect = [...userRight].sort().join(',') === [...targetRight].sort().join(',');

    const currentReaction = queue[0];

    if (isLeftCorrect && isRightCorrect) {
      setFeedbackStatus('success');
      message.success('Correct!');
      if (currentReaction.attempts === 0) {
        setScore(prev => prev + 1);
      }
    } else {
      setFeedbackStatus('error');
      message.error('Incorrect order.');
    }
  };

  const handleNextQuestion = () => {
    let newQueue = [...queue];
    let processedQ = { ...newQueue.shift() }; 
    processedQ.attempts += 1;

    if (feedbackStatus === 'success') {
      processedQ.needed -= 1;
    } else {
      processedQ.needed = 2; // Penalty logic: Must answer correctly 2 times to clear
    }

    if (processedQ.needed > 0) {
      // Re-insert 2 places back in the queue
      const insertIndex = Math.min(2, newQueue.length);
      newQueue.splice(insertIndex, 0, processedQ);
    } else {
      setCompletedCount(prev => prev + 1);
    }

    if (newQueue.length === 0) {
      setIsFinished(true);
    } else {
      setQueue(newQueue);
    }
  };

  // ---------------- Render Result Screen ----------------
  if (isFinished) {
    const finalScore = Math.max(0, Math.round((score / totalQuestions) * 100));
    return (
      <SessionResult 
        score={finalScore}
        resultMessage={`"${data?.title || 'Chemistry'}": You ordered ${score} out of ${totalQuestions} reactions right on the first try!`}
        onBack={onBack}
        onRestart={() => {
          const initialQueue = shuffleArray([...data.reactions]).map(r => ({ ...r, needed: 1, attempts: 0 }));
          setQueue(initialQueue);
          setTotalQuestions(initialQueue.length);
          setCompletedCount(0);
          setScore(0);
          setIsFinished(false);
        }}
        practiceId={data.id} 
        practiceType="Chem Swap"
      />
    );
  }

  const currentReaction = queue[0];
  if (!currentReaction) return null;

  const isAllFilled = selectedSlots.every(slot => slot !== null);
  const progressPercent = Math.round((completedCount / totalQuestions) * 100);

  const arrowFormula = currentReaction.condition && currentReaction.condition.trim() !== "" 
    ? `\\xrightarrow{\\text{${currentReaction.condition}}}` 
    : `\\rightarrow`;

  return (
    <div className="mt-12 min-h-screen p-4 sm:p-8 max-w-4xl mx-auto flex flex-col items-center">
      <div className="w-full flex justify-between items-center mb-6">
        <Button icon={<ArrowLeft size={16} />} onClick={onBack}>
          
        </Button>
        <div style={{ flex: 1, maxWidth: 300, margin: '0 20px' }}>
          <Flex vertical align="center">
            <Text strong style={{ color: 'white' }}>{completedCount} / {totalQuestions}</Text>
            <Progress percent={progressPercent} showInfo={false} size="small" status="active" />
          </Flex>
        </div>
        <div style={{ width: 85 }}></div> {/* Spacer */}
      </div>

      <div className="bg-white/95 p-8 rounded-3xl w-full text-center shadow-xl mb-6">
        <Title level={4} style={{ marginBottom: '8px', color: '#1f2937' }}>
          {currentReaction.name}
        </Title>
        {currentReaction.attempts > 0 && (
          <Text type="danger" style={{ display: 'block', marginBottom: '8px' }}>
            (Review)
          </Text>
        )}

        {/* --- User's Attempted Order Area --- */}
        <div 
          className="flex flex-wrap justify-center items-center gap-4 mb-8 p-6 rounded-2xl"
          style={{ 
            backgroundColor: feedbackStatus === 'error' ? '#fff1f0' : feedbackStatus === 'success' ? '#f6ffed' : '#f3f4f6',
            border: feedbackStatus === 'error' ? '2px solid #ffa39e' : feedbackStatus === 'success' ? '2px solid #b7eb8f' : '2px dashed #d1d5db',
            transition: 'all 0.3s ease'
          }}
        >
          {/* Reactants (Left Side) */}
          <Flex gap="small" align="center" wrap="wrap">
            {selectedSlots.slice(0, targetLeft.length).map((slot, idx) => (
              <React.Fragment key={`left-slot-${idx}`}>
                <div 
                  onClick={() => handleDeselectFromSlots(idx)}
                  className="flex items-center justify-center rounded-xl"
                  style={{
                    minWidth: 80,
                    height: 60,
                    padding: '0 16px',
                    backgroundColor: slot ? '#ffffff' : 'rgba(0,0,0,0.05)',
                    border: slot ? '2px solid #1890ff' : '2px dashed #bfbfbf',
                    boxShadow: slot ? '0 4px 6px rgba(0,0,0,0.05)' : 'none',
                    transition: 'all 0.2s',
                    cursor: feedbackStatus === null && slot ? 'pointer' : 'default',
                    opacity: feedbackStatus === 'error' && slot ? 0.7 : 1
                  }}
                >
                  {slot && <InlineMath math={slot.formula} style={{ fontSize: '1.2rem' }} />}
                </div>
                {idx < targetLeft.length - 1 && (
                  <Text strong style={{ fontSize: '1.5rem', color: '#6b7280' }}>+</Text>
                )}
              </React.Fragment>
            ))}
          </Flex>

          {/* Arrow & Condition */}
          <div className="mx-4 text-center text-blue-600 my-4 sm:my-0">
            <BlockMath math={arrowFormula} />
          </div>

          {/* Products (Right Side) */}
          <Flex gap="small" align="center" wrap="wrap">
            {selectedSlots.slice(targetLeft.length).map((slot, idx) => {
              const globalIdx = targetLeft.length + idx;
              return (
                <React.Fragment key={`right-slot-${idx}`}>
                  <div 
                    onClick={() => handleDeselectFromSlots(globalIdx)}
                    className="flex items-center justify-center rounded-xl"
                    style={{
                      minWidth: 80,
                      height: 60,
                      padding: '0 16px',
                      backgroundColor: slot ? '#ffffff' : 'rgba(0,0,0,0.05)',
                      border: slot ? '2px solid #52c41a' : '2px dashed #bfbfbf',
                      boxShadow: slot ? '0 4px 6px rgba(0,0,0,0.05)' : 'none',
                      transition: 'all 0.2s',
                      cursor: feedbackStatus === null && slot ? 'pointer' : 'default',
                      opacity: feedbackStatus === 'error' && slot ? 0.7 : 1
                    }}
                  >
                    {slot && <InlineMath math={slot.formula} style={{ fontSize: '1.2rem' }} />}
                  </div>
                  {idx < targetRight.length - 1 && (
                    <Text strong style={{ fontSize: '1.5rem', color: '#6b7280' }}>+</Text>
                  )}
                </React.Fragment>
              );
            })}
          </Flex>
        </div>

        {/* --- Correct Answer Display (Only shows on Error) --- */}
        {feedbackStatus === 'error' && (
          <div className="mb-8 p-6 rounded-2xl bg-green-50 border-2 border-green-300 shadow-sm animate-fade-in">
            <Flex justify="center" align="center" wrap="wrap" gap="small">
              {/* Correct Reactants */}
              <Flex gap="small" align="center" wrap="wrap">
                {targetLeft.map((formula, idx) => (
                  <React.Fragment key={`correct-left-${idx}`}>
                    <div className="flex items-center justify-center rounded-xl bg-white border-2 border-green-500" style={{ minWidth: 80, height: 60, padding: '0 16px' }}>
                      <InlineMath math={formula} style={{ fontSize: '1.2rem' }} />
                    </div>
                    {idx < targetLeft.length - 1 && <Text strong style={{ fontSize: '1.5rem', color: '#15803d' }}>+</Text>}
                  </React.Fragment>
                ))}
              </Flex>

              {/* Arrow */}
              <div className="mx-4 text-center text-green-700 my-4 sm:my-0">
                <BlockMath math={arrowFormula} />
              </div>

              {/* Correct Products */}
              <Flex gap="small" align="center" wrap="wrap">
                {targetRight.map((formula, idx) => (
                  <React.Fragment key={`correct-right-${idx}`}>
                    <div className="flex items-center justify-center rounded-xl bg-white border-2 border-green-500" style={{ minWidth: 80, height: 60, padding: '0 16px' }}>
                      <InlineMath math={formula} style={{ fontSize: '1.2rem' }} />
                    </div>
                    {idx < targetRight.length - 1 && <Text strong style={{ fontSize: '1.5rem', color: '#15803d' }}>+</Text>}
                  </React.Fragment>
                ))}
              </Flex>
            </Flex>
          </div>
        )}

        {/* --- Check / Next Button --- */}
        <div className="flex justify-center mb-8">
          {feedbackStatus === null ? (
            <Button 
              type="primary" 
              size="large" 
              disabled={!isAllFilled}
              onClick={handleCheckOrder}
              style={{ height: 50, padding: '0 40px', fontSize: '1.1rem', borderRadius: 25 }}
            >
              Check
            </Button>
          ) : (
            <Button 
              type="primary" 
              size="large" 
              onClick={handleNextQuestion}
              style={{ 
                height: 50, padding: '0 40px', fontSize: '1.1rem', borderRadius: 25, 
                backgroundColor: feedbackStatus === 'error' ? '#ff4d4f' : '#52c41a',
                display: 'flex', alignItems: 'center', gap: '8px'
              }}
            >
              Next <ArrowRight size={20} />
            </Button>
          )}
        </div>

        {/* --- Available Queue Area (Hides after submission) --- */}
        {feedbackStatus === null && (
          <>
            <div className="w-full h-px bg-gray-200 mb-8"></div>
            <div>
              <div className="flex flex-wrap justify-center gap-4 min-h-[80px]">
                {availableQueue.map((compound) => (
                  <Button
                    key={compound.id}
                    onClick={() => handleSelectFromQueue(compound)}
                    style={{
                      height: 'auto', minHeight: 60, padding: '10px 24px',
                      borderRadius: 16, fontSize: '1.2rem', display: 'flex', alignItems: 'center',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
                    }}
                  >
                    <InlineMath math={compound.formula} />
                  </Button>
                ))}
                {availableQueue.length === 0 && (
                  <Text type="secondary" italic style={{ alignSelf: 'center' }}>
                    All compounds placed!
                  </Text>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default SwapSession;