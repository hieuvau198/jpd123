import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Home, RefreshCw, Brain, ArrowRight } from 'lucide-react';
import { Card, Button, Typography, Progress, Result, Alert, Flex, Space } from 'antd';

const { Title, Text } = Typography;

const shuffleArray = (array) => {
  const newArr = [...array];
  for (let i = newArr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArr[i], newArr[j]] = [newArr[j], newArr[i]];
  }
  return newArr;
};

const prepareSessionData = (originalData) => {
  const rawQuestions = Array.isArray(originalData) 
    ? originalData.flatMap(d => d.questions) 
    : (originalData.questions || []);
  if (rawQuestions.length === 0) return [];
  const shuffledQuestions = shuffleArray(rawQuestions);
  return shuffledQuestions.map(q => ({
    ...q,
    // Fix: Map 'answer' from JSON to 'correctAnswer' for the component logic
    correctAnswer: q.correctAnswer || q.answer, 
    _tempId: Math.random().toString(36).substr(2, 9), 
    options: shuffleArray(q.options)
  }));
};

const QuizSession = ({ data, onHome }) => {
  const [questions, setQuestions] = useState(() => prepareSessionData(data));
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0); 
  const [isFinished, setIsFinished] = useState(false);
  const [selectedOption, setSelectedOption] = useState(null);
  const [isWrong, setIsWrong] = useState(false);
  const [hasFailedCurrent, setHasFailedCurrent] = useState(false);

  if (!questions || questions.length === 0) {
    return <div style={{ padding: 40, color: 'white' }}><h2>Error: No questions found.</h2></div>;
  }

  const currentQuestion = questions[currentIndex];
  const progressPercent = Math.round(((currentIndex) / questions.length) * 100);

  const handleOptionClick = (option) => {
    if (isWrong) return; 
    setSelectedOption(option);

    const cleanOption = String(option).trim();
    // Logic relies on currentQuestion.correctAnswer (mapped in prepareSessionData)
    const cleanAnswer = String(currentQuestion.correctAnswer).trim();

    if (cleanOption === cleanAnswer) {
      if (!hasFailedCurrent) setScore((prev) => prev + 1);
      setTimeout(() => handleNext(), 500); 
    } else {
      setIsWrong(true);
      if (!hasFailedCurrent) {
        setHasFailedCurrent(true);
        setQuestions(prev => [...prev, { ...currentQuestion, _retry: true }]);
      }
    }
  };

  const handleNext = () => {
    if (currentIndex + 1 < questions.length) {
      setCurrentIndex(prev => prev + 1);
      setSelectedOption(null);
      setIsWrong(false);
      setHasFailedCurrent(false);
    } else {
      setIsFinished(true);
    }
  };

  const restart = () => {
    setQuestions(prepareSessionData(data));
    setCurrentIndex(0);
    setScore(0);
    setIsFinished(false);
    setSelectedOption(null);
    setIsWrong(false);
    setHasFailedCurrent(false);
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (isFinished || isWrong || (selectedOption && selectedOption === currentQuestion.correctAnswer)) return;
      const key = e.key.toLowerCase();
      const indexMap = { '1': 0, '2': 1, '3': 2, '4': 3 };
      if (Object.prototype.hasOwnProperty.call(indexMap, key)) {
        const index = indexMap[key];
        if (index < currentQuestion.options.length) handleOptionClick(currentQuestion.options[index]);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, isFinished, isWrong, selectedOption, currentQuestion]);

  if (isFinished) {
    return (
      <Flex justify="center" align="center" style={{ minHeight: '80vh', padding: 20 }}>
        <Card style={{ width: '100%', maxWidth: 500, textAlign: 'center' }}>
          <Result
            icon={<CheckCircle size={60} color="#52c41a" />}
            status="success"
            title="SESSION COMPLETE"
            subTitle="You have successfully mastered all questions."
            extra={[
               <div key="score" style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: 20 }}>
                 Mastery Score: {score}
               </div>,
               <Button key="home" icon={<Home size={16}/>} onClick={onHome}>Home</Button>,
               <Button key="restart" type="primary" icon={<RefreshCw size={16}/>} onClick={restart}>Restart</Button>
            ]}
          />
        </Card>
      </Flex>
    );
  }

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: '40px 20px' }}>
      <Card bordered={false} bodyStyle={{ padding: 0 }}>
        {/* Header */}
        <Flex justify="space-between" align="center" style={{ padding: '16px 24px', borderBottom: '1px solid #f0f0f0' }}>
          <Button type="text" icon={<Home size={16} />} onClick={onHome}>EXIT</Button>
          <Space>
             {hasFailedCurrent && <Text type="danger" strong>RETRY MODE</Text>}
             <Text strong>{currentIndex + 1} / {questions.length}</Text>
          </Space>
        </Flex>
        
        {/* Progress Bar */}
        <Progress percent={progressPercent} showInfo={false} strokeColor="black" size="small" shape="square" style={{lineHeight: 0}} />

        {/* Question Area */}
        <div style={{ padding: 40 }}>
        <Title level={2} style={{ marginTop: 0 }}>
  {currentQuestion.text || currentQuestion.question}
</Title>
          <Flex vertical gap="middle" style={{ marginTop: 30 }}>
            {currentQuestion.options.map((option, idx) => {
              const isSelected = selectedOption === option;
              const isCorrect = option === currentQuestion.correctAnswer;
              
              let status = 'default';
              if (isSelected && isCorrect) status = 'primary';
              if (isSelected && !isCorrect) status = 'danger';
              
              const customStyle = {};
              if (isSelected && isCorrect) { customStyle.backgroundColor = 'black'; customStyle.color = 'white'; customStyle.borderColor = 'black'; }
              if (isSelected && !isCorrect) { customStyle.color = '#ff4d4f'; customStyle.borderColor = '#ff4d4f'; }
              if (isWrong && isCorrect) { customStyle.borderColor = 'black'; customStyle.borderWidth = 2; }

              return (
                <Button
                  key={idx}
                  size="large"
                  block
                  onClick={() => handleOptionClick(option)}
                  disabled={isWrong || (selectedOption && isCorrect)}
                  style={{ height: 'auto', padding: '20px', textAlign: 'left', justifyContent: 'flex-start', fontSize: '1.1rem', ...customStyle }}
                >
                  <Flex justify="space-between" align="center" style={{ width: '100%' }}>
                     <span>{option}</span>
                     {isSelected && isCorrect && <CheckCircle size={20} />}
                     {isSelected && !isCorrect && <XCircle size={20} />}
                  </Flex>
                </Button>
              );
            })}
          </Flex>

          {isWrong && (
            <Alert
              message={<span style={{ fontWeight: 'bold' }}>INSIGHT</span>}
              description={currentQuestion.explanation}
              type="info"
              showIcon
              icon={<Brain size={24} />}
              style={{ marginTop: 30, borderColor: 'black', background: '#f8f9fa' }}
              action={
                <Button type="primary" style={{ background: 'black' }} onClick={handleNext}>
                  NEXT <ArrowRight size={16} />
                </Button>
              }
            />
          )}
        </div>
      </Card>
    </div>
  );
};

export default QuizSession;