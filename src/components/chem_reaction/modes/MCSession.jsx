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

// Helper to split the chemical formula into left (Reactants) and right (Products) sides
const splitFormula = (formula) => {
  if (!formula) return { left: '', right: '' };
  const parts = formula.split(/\\x?rightarrow(?:\{[^}]*\})?|\\rightleftharpoons|\\rightarrow/);
  return {
    left: parts[0] ? parts[0].trim() : '',
    right: parts[1] ? parts[1].trim() : formula 
  };
};

const MCSession = ({ data, onBack }) => {
  const [mode, setMode] = useState(null); // 'name-formula' | 'formula-formula' | 'formula-description'
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
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
        
        // Define what type of content is being displayed to render KaTeX conditionally
        let qType = 'text';
        let aType = 'text';

        if (mode === 'name-formula') {
          questionText = reaction.name;
          correctOption = reaction.formula;
          allWrongOptionsData = data.reactions.map(r => r.formula);
          qType = 'text';
          aType = 'formula';
        } else if (mode === 'formula-formula') {
          questionText = splitFormula(reaction.formula).right;
          correctOption = splitFormula(reaction.formula).left;
          allWrongOptionsData = data.reactions.map(r => splitFormula(r.formula).left);
          qType = 'formula';
          aType = 'formula';
        } else if (mode === 'formula-description') {
          questionText = reaction.formula;
          correctOption = reaction.description;
          allWrongOptionsData = data.reactions.map(r => r.description);
          qType = 'formula';
          aType = 'text';
        }

        // Get up to 3 random wrong options
        const wrongOptionsPool = allWrongOptionsData.filter(opt => opt !== correctOption);
        const selectedWrongOptions = shuffleArray(wrongOptionsPool).slice(0, 3);
        
        // Combine and shuffle to get 4 final options
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

      setQuestions(shuffleArray(generatedQuestions));
      setCurrentIndex(0);
      setScore(0);
      setIsFinished(false);
      setSelectedAnswer(null);
    }
  }, [mode, data]);

  const handleModeSelect = (selectedMode) => {
    setMode(selectedMode);
  };

  const handleAnswer = (option) => {
    if (selectedAnswer !== null) return; // Prevent multiple clicks

    setSelectedAnswer(option);
    
    const isCorrect = option === questions[currentIndex].correct;
    if (isCorrect) {
      setScore((prev) => prev + 1);
    }

    // Wait a second before moving to the next question
    setTimeout(() => {
      if (currentIndex < questions.length - 1) {
        setCurrentIndex((prev) => prev + 1);
        setSelectedAnswer(null);
      } else {
        setIsFinished(true);
      }
    }, 1200);
  };

  const resetSession = () => {
    setMode(null);
    setQuestions([]);
    setCurrentIndex(0);
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
    const finalScore = Math.round((score / questions.length) * 100);
    return (
      <SessionResult 
        score={finalScore}
        resultMessage={`"${data?.title || 'Chemistry'}": You got ${score} out of ${questions.length} correct!`}
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
                <FlaskConical size={24} /> Products → Reactants
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
  const currentQuestion = questions[currentIndex];
  if (!currentQuestion) return null;

  const progressPercent = Math.round(((currentIndex) / questions.length) * 100);

  return (
    <div className="min-h-screen p-4 sm:p-8 max-w-4xl mx-auto flex flex-col">
      <Flex justify="space-between" align="center" style={{ marginBottom: 20 }}>
        <Button icon={<ArrowLeft size={20} />} onClick={resetSession}>Modes</Button>
        
        <div style={{ flex: 1, maxWidth: 300, margin: '0 20px' }}>
          <Flex vertical align="center">
            <Text strong style={{ color: 'white' }}>Question {currentIndex + 1} of {questions.length}</Text>
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
            {mode === 'formula-formula' && 'What are the reactants for:'}
            {mode === 'formula-description' && 'What is the description of:'}
          </Text>
          <div style={{ fontSize: '1.8rem', fontWeight: 'bold', marginTop: 16, color: '#1f2937' }}>
            {renderContent(currentQuestion.question, currentQuestion.qType)}
          </div>
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