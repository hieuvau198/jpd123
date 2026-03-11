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

// Helper to split the chemical formula and capture the arrow + condition
const splitFormula = (formula) => {
  if (!formula) return { left: '', right: '', arrow: '\\rightarrow' };
  const match = formula.match(/(\\x?rightarrow(?:\{[^}]*\})?|\\rightleftharpoons|\\rightarrow)/);
  const arrow = match ? match[0] : '\\rightarrow';
  const parts = formula.split(/\\x?rightarrow(?:\{[^}]*\})?|\\rightleftharpoons|\\rightarrow/);
  return {
    left: parts[0] ? parts[0].trim() : '',
    right: parts[1] ? parts[1].trim() : formula,
    arrow
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

        if (mode === 'name-formula') {
          questionText = reaction.name;
          correctOption = reaction.formula;
          allWrongOptionsData = data.reactions.map(r => r.formula);
          qType = 'text';
          aType = 'formula';
        } else if (mode === 'formula-formula') {
          // Display the reactants + arrow at the end of the question
          questionText = `${left} \\space ${arrow} \\text{ ?}`;
          correctOption = right;
          allWrongOptionsData = data.reactions.map(r => splitFormula(r.formula).right);
          qType = 'formula';
          aType = 'formula';
        } else if (mode === 'formula-description') {
          questionText = reaction.formula;
          correctOption = reaction.description;
          allWrongOptionsData = data.reactions.map(r => r.description);
          qType = 'formula';
          aType = 'text';
        }

        const wrongOptionsPool = allWrongOptionsData.filter(opt => opt !== correctOption);
        const selectedWrongOptions = shuffleArray(wrongOptionsPool).slice(0, 3);
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

      // Initialize the queue: each question needs 1 correct answer to pass initially.
      const initialQueue = shuffleArray(generatedQuestions).map(q => ({ ...q, needed: 1, attempts: 0 }));
      setQueue(initialQueue);
      setTotalQuestions(initialQueue.length);
      setCompletedCount(0);
      setScore(0);
      setIsFinished(false);
      setSelectedAnswer(null);
    }
  }, [mode, data]);

  const handleModeSelect = (selectedMode) => {
    setMode(selectedMode);
  };

  const handleAnswer = (option) => {
    if (selectedAnswer !== null || queue.length === 0) return;

    setSelectedAnswer(option);
    
    const currentQ = queue[0];
    const isCorrect = option === currentQ.correct;
    
    // Only grant score if they got it right on their very first attempt
    if (isCorrect && currentQ.attempts === 0) {
      setScore((prev) => prev + 1);
    }

    setTimeout(() => {
      let newQueue = [...queue];
      let processedQ = { ...newQueue.shift() }; // Remove from front
      processedQ.attempts += 1;

      if (isCorrect) {
        processedQ.needed -= 1;
      } else {
        processedQ.needed = 2; // Penalty: requires 2 correct answers to clear
      }

      if (processedQ.needed > 0) {
        // Push the question back into the queue at most 2 slots away
        const insertIndex = Math.min(2, newQueue.length);
        newQueue.splice(insertIndex, 0, processedQ);
      } else {
        setCompletedCount((prev) => prev + 1);
      }

      setQueue(newQueue);
      setSelectedAnswer(null);

      // Finish when the queue is totally empty
      if (newQueue.length === 0) {
        setIsFinished(true);
      }
    }, 1200);
  };

  const resetSession = () => {
    setMode(null);
    setQueue([]);
    setTotalQuestions(0);
    setCompletedCount(0);
    setScore(0);
    setSelectedAnswer(null);
    setIsFinished(false);
  };

  const renderContent = (content, type) => {
    if (!content) return "";
    if (type === 'formula') {
      return <InlineMath math={content} />;
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
      />
    );
  }

  // ---------------- Render Mode Selection Screen ----------------
  if (!mode) {
    return (
      <div className="min-h-screen p-4 sm:p-8 max-w-3xl mx-auto flex flex-col items-center">
        <div className="w-full flex justify-start mb-6">
          <Button icon={<ArrowLeft size={16} />} onClick={onBack}>
            Back
          </Button>
        </div>
        
        <div className="bg-white/10 p-8 sm:p-12 rounded-2xl w-full text-center text-white border border-white/20">
          <Title level={2} style={{ color: 'white', marginBottom: '8px' }}>Multiple Choice</Title>
          <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: '1.1rem', display: 'block', marginBottom: '40px' }}>
            Choose a format for {data?.title}
          </Text>
          
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
    <div className="min-h-screen p-4 sm:p-8 max-w-4xl mx-auto flex flex-col">
      <Flex justify="space-between" align="center" style={{ marginBottom: 20 }}>
        <Button icon={<ArrowLeft size={20} />} onClick={resetSession}>Modes</Button>
        
        <div style={{ flex: 1, maxWidth: 300, margin: '0 20px' }}>
          <Flex vertical align="center">
            <Text strong style={{ color: 'white' }}>Learned: {completedCount} / {totalQuestions}</Text>
            <Progress percent={progressPercent} showInfo={false} size="small" status="active" />
          </Flex>
        </div>
        
        <div style={{ width: 80 }} /> {/* Spacer to balance flex */}
      </Flex>

      <Card 
        style={{ 
          background: 'rgba(255, 255, 255, 0.95)', 
          borderRadius: 20,
          boxShadow: '0 8px 32px rgba(0,0,0,0.1)' 
        }}
        bodyStyle={{ padding: '40px 24px' }}
      >
        <div className="text-center mb-10">
          <Text type="secondary" style={{ fontSize: '1rem', textTransform: 'uppercase', letterSpacing: 1 }}>
            {mode === 'name-formula' && 'Which formula belongs to:'}
            {mode === 'formula-formula' && 'What are the products for:'}
            {mode === 'formula-description' && 'What is the description of:'}
          </Text>
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
              border: '2px solid #d9d9d9'
            };

            // Apply colors if an answer has been selected
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
                  disabled={selectedAnswer !== null}
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