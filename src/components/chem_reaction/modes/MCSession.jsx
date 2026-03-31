import React, { useState, useEffect } from 'react';
import { Card, Button, Typography, Flex, Progress, Row, Col } from 'antd';
import { ArrowLeft, BookOpen, FlaskConical, AlignLeft } from 'lucide-react';
import SessionResult from '../../SessionResult';

// Import KaTeX for rendering chemical formulas
import 'katex/dist/katex.min.css';
import { InlineMath } from 'react-katex';

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

const MCSession = ({ data, onBack }) => {
  const [mode, setMode] = useState(null);
  
  // Spaced Repetition Queue State
  const [queue, setQueue] = useState([]);
  const [totalQuestions, setTotalQuestions] = useState(0);
  const [completedCount, setCompletedCount] = useState(0);
  
  const [score, setScore] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [isFinished, setIsFinished] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false); // Prevents double clicking

  // Generate questions when a mode is selected
  useEffect(() => {
    if (mode && data?.reactions) {
      const generatedQuestions = data.reactions.map((reaction) => {
        let questionText = '';
        let correctOption = '';
        let allWrongOptionsData = [];
        
        let qType = 'text';
        let aType = 'text';

        const { left, right, arrow } = splitFormula(reaction.formula);
        // Fallback for description if it doesn't exist
        const descriptionOrName = reaction.description || reaction.name;

        if (mode === 'name-formula') {
          questionText = reaction.name;
          correctOption = reaction.formula;
          allWrongOptionsData = data.reactions.map(r => r.formula);
          qType = 'text';
          aType = 'formula';
        } else if (mode === 'formula-formula') {
          questionText = `${left} \\space ${arrow} \\text{ ?}`;
          correctOption = right;
          allWrongOptionsData = data.reactions.map(r => splitFormula(r.formula).right);
          qType = 'formula';
          aType = 'formula';
        } else if (mode === 'formula-description') {
          questionText = reaction.formula;
          correctOption = descriptionOrName;
          allWrongOptionsData = data.reactions.map(r => r.description || r.name);
          qType = 'formula';
          aType = 'text';
        }

        // Ensure distinct wrong options
        const uniqueWrongOptions = [...new Set(allWrongOptionsData)].filter(opt => opt !== correctOption);
        const selectedWrongOptions = shuffleArray(uniqueWrongOptions).slice(0, 3);
        const options = shuffleArray([correctOption, ...selectedWrongOptions]);

        return {
          id: reaction.id,
          question: questionText,
          correct: correctOption,
          options: options,
          qType,
          aType
        };
      });

      const initialQueue = shuffleArray(generatedQuestions).map(q => ({ ...q, needed: 1, attempts: 0 }));
      setQueue(initialQueue);
      setTotalQuestions(initialQueue.length);
      setCompletedCount(0);
      setScore(0);
      setIsFinished(false);
      setSelectedAnswer(null);
      setIsProcessing(false);
    }
  }, [mode, data]);

  const handleModeSelect = (selectedMode) => {
    setMode(selectedMode);
  };

  const handleAnswer = (option) => {
    if (selectedAnswer !== null || queue.length === 0 || isProcessing) return;

    setIsProcessing(true);
    setSelectedAnswer(option);
    
    const currentQ = queue[0];
    const isCorrect = option === currentQ.correct;
    
    if (isCorrect && currentQ.attempts === 0) {
      setScore((prev) => prev + 1);
    }

    const delay = isCorrect ? 1200 : 3500; // Reduced wrong delay slightly for better UX

    setTimeout(() => {
      let newQueue = [...queue];
      let processedQ = { ...newQueue.shift() };
      processedQ.attempts += 1;

      if (isCorrect) {
        processedQ.needed -= 1;
      } else {
        processedQ.needed = 2; 
      }

      if (processedQ.needed > 0) {
        const insertIndex = Math.min(2, newQueue.length);
        newQueue.splice(insertIndex, 0, processedQ);
      } else {
        setCompletedCount((prev) => prev + 1);
      }

      setQueue(newQueue);
      setSelectedAnswer(null);
      setIsProcessing(false);

      if (newQueue.length === 0) {
        setIsFinished(true);
      }
    }, delay);
  };

  const resetSession = () => {
    setMode(null);
    setQueue([]);
    setTotalQuestions(0);
    setCompletedCount(0);
    setScore(0);
    setSelectedAnswer(null);
    setIsFinished(false);
    setIsProcessing(false);
  };

  const renderContent = (content, type) => {
    if (!content) return "";
    if (type === 'formula') {
      // Added errorColor to gracefully handle any malformed LaTeX strings
      return <InlineMath math={content} errorColor="#cc0000" />;
    }
    return <span>{content}</span>;
  };

  // ---------------- Render Result Screen ----------------
  if (isFinished) {
    const finalScore = Math.round((score / totalQuestions) * 100);
    return (
      <SessionResult 
        score={finalScore}
        resultMessage={`"${data?.title || 'Chemistry'}": You got ${score} out of ${totalQuestions} correct on the first try!`}
        onBack={onBack}
        onRestart={resetSession}
        practiceId={data?.id} 
        practiceType="Chem Quiz"
        practiceName={data.title} // Add this line
      />
    );
  }

  // ---------------- Render Mode Selection Screen ----------------
  if (!mode) {
    return (
      <div className="mt-12 min-h-screen p-4 sm:p-8 max-w-3xl mx-auto flex flex-col items-center">
        <div className="w-full flex justify-start mb-6">
          <Button icon={<ArrowLeft size={16} />} onClick={onBack}></Button>
        </div>
        
        <div className="bg-white/10 p-8 sm:p-12 rounded-2xl w-full text-center text-white border border-white/20">
          <Flex vertical gap="large" style={{ maxWidth: 400, margin: '0 auto' }}>
            <Button size="large" block style={{ height: 'auto', padding: '16px' }} onClick={() => handleModeSelect('name-formula')}>
              <Flex align="center" justify="center" gap="middle" style={{ fontSize: '1.2rem', width: '100%' }}>
                <BookOpen size={24} /> Name → Formula
              </Flex>
            </Button>
            
            <Button size="large" block style={{ height: 'auto', padding: '16px' }} onClick={() => handleModeSelect('formula-formula')}>
              <Flex align="center" justify="center" gap="middle" style={{ fontSize: '1.2rem', width: '100%' }}>
                <FlaskConical size={24} /> Reactants → Products
              </Flex>
            </Button>
            
            <Button size="large" block style={{ height: 'auto', padding: '16px' }} onClick={() => handleModeSelect('formula-description')}>
              <Flex align="center" justify="center" gap="middle" style={{ fontSize: '1.2rem', width: '100%' }}>
                <AlignLeft size={24} /> Formula → Description
              </Flex>
            </Button>
          </Flex>
        </div>
      </div>
    );
  }

  // ---------------- Render Question Screen ----------------
  const currentQuestion = queue[0];
  if (!currentQuestion) return null;

  const progressPercent = Math.round((completedCount / totalQuestions) * 100);

  return (
    <div className="mt-12 min-h-screen p-4 sm:p-8 max-w-4xl mx-auto flex flex-col">
      <Flex justify="space-between" align="center" style={{ marginBottom: 20 }}>
        <Button icon={<ArrowLeft size={20} />} onClick={resetSession}></Button>
        
        <div style={{ flex: 1, maxWidth: 300, margin: '0 20px' }}>
          <Flex vertical align="center">
            <Text strong style={{ color: 'white' }}>{completedCount} / {totalQuestions}</Text>
            <Progress percent={progressPercent} showInfo={false} size="small" status="active" />
          </Flex>
        </div>
        
        <div style={{ width: 80 }} /> 
      </Flex>

      <Card 
        style={{ 
          background: 'rgba(255, 255, 255, 0.95)', 
          borderRadius: 20,
          boxShadow: '0 8px 32px rgba(0,0,0,0.1)' 
        }}
        bodyStyle={{ padding: '40px 24px' }}
      >
        <div className="text-center mb-10 overflow-x-auto">
          <div style={{ fontSize: '1.8rem', fontWeight: 'bold', marginTop: 16, color: '#1f2937' }}>
            {renderContent(currentQuestion.question, currentQuestion.qType)}
          </div>
          {currentQuestion.attempts > 0 && (
            <Text type="danger" style={{ display: 'block', marginTop: 10 }}>
              (Review)
            </Text>
          )}
        </div>

        <Row gutter={[16, 16]}>
          {currentQuestion.options.map((option, idx) => {
            const isSelected = selectedAnswer === option;
            const isCorrect = option === currentQuestion.correct;
            
            let btnStyle = { 
              height: 'auto', 
              minHeight: '80px', 
              padding: '16px', 
              fontSize: currentQuestion.aType === 'formula' ? '1.4rem' : '1.1rem',
              whiteSpace: 'normal',
              textAlign: 'center',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '2px solid #d9d9d9',
              transition: 'all 0.3s ease'
            };

            if (selectedAnswer !== null) {
              if (isCorrect) {
                btnStyle.backgroundColor = '#f6ffed';
                btnStyle.borderColor = '#52c41a';
                btnStyle.color = '#237804';
              } else if (isSelected && !isCorrect) {
                btnStyle.backgroundColor = '#fff2f0';
                btnStyle.borderColor = '#ff4d4f';
                btnStyle.color = '#a8071a';
              }
            }

            return (
              <Col xs={24} md={12} key={idx}>
                <Button 
                  block 
                  style={btnStyle}
                  onClick={() => handleAnswer(option)}
                  disabled={selectedAnswer !== null || isProcessing}
                >
                  {renderContent(option, currentQuestion.aType)}
                </Button>
              </Col>
            );
          })}
        </Row>
      </Card>
    </div>
  );
};

export default MCSession;