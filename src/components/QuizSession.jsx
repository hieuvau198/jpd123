import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Home, Brain, ArrowRight } from 'lucide-react';
import { Card, Button, Typography, Progress, Alert, Flex, Space } from 'antd';
import SessionResult from './SessionResult';

const { Title, Text } = Typography;

const shuffleArray = (array) => {
  const newArr = [...array];
  for (let i = newArr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArr[i], newArr[j]] = [newArr[j], newArr[i]];
  }
  return newArr;
};

const prepareSessionData = (originalData, limit = null) => {
  const rawQuestions = Array.isArray(originalData) 
    ? originalData.flatMap(d => d.questions) 
    : (originalData.questions || []);
  if (rawQuestions.length === 0) return [];
  
  let shuffledQuestions = shuffleArray(rawQuestions);
  
  if (limit && limit > 0 && limit < shuffledQuestions.length) {
    shuffledQuestions = shuffledQuestions.slice(0, limit);
  }

  return shuffledQuestions.map(q => ({
    ...q,
    correctAnswer: q.correctAnswer || q.answer, 
    _tempId: Math.random().toString(36).substr(2, 9), 
    options: shuffleArray(q.options)
  }));
};

const renderFormattedText = (text) => {
  if (typeof text !== 'string') return text;
  
  const parts = text.split(/\*\*(.*?)\*\*/g);
  
  return parts.map((part, index) => {
    const processNewLines = (str) => {
      return str.split('\n').map((line, i, arr) => (
        <React.Fragment key={i}>
          {line}
          {i < arr.length - 1 && <br />}
        </React.Fragment>
      ));
    };

    if (index % 2 === 1) {
      return <u key={index}>{processNewLines(part)}</u>;
    }
    
    return <React.Fragment key={index}>{processNewLines(part)}</React.Fragment>;
  });
};

const QuizSession = ({ data, onHome, initialNumbers }) => {
  const rawQuestions = Array.isArray(data) ? data.flatMap(d => d.questions) : (data.questions || []);
  const rawCount = rawQuestions.length;

  const [limit, setLimit] = useState(initialNumbers || rawCount);
  const [questions, setQuestions] = useState(() => prepareSessionData(data, limit));
  const [totalQuestions, setTotalQuestions] = useState(() => questions.length);
  
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0); 
  const [isFinished, setIsFinished] = useState(false);
  const [selectedOption, setSelectedOption] = useState(null);
  const [isWrong, setIsWrong] = useState(false);
  const [hasFailedCurrent, setHasFailedCurrent] = useState(false);

  const currentQuestion = questions[currentIndex];

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (isFinished || isWrong || (selectedOption && currentQuestion && selectedOption === currentQuestion.correctAnswer)) return;
      
      const key = e.key.toLowerCase();
      const indexMap = { '1': 0, '2': 1, '3': 2, '4': 3 };
      if (Object.prototype.hasOwnProperty.call(indexMap, key)) {
        const index = indexMap[key];
        if (currentQuestion && index < currentQuestion.options.length) {
          handleOptionClick(currentQuestion.options[index]);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, isFinished, isWrong, selectedOption, currentQuestion]);

  const handleOptionClick = (option) => {
    if (isWrong) return; 
    setSelectedOption(option);

    const cleanOption = String(option).trim();
    const cleanAnswer = String(currentQuestion.correctAnswer).trim();

    if (cleanOption === cleanAnswer) {
      if (!hasFailedCurrent && !currentQuestion._retry) {
        setScore((prev) => prev + 1);
      }
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
    const prepped = prepareSessionData(data, limit);
    setQuestions(prepped);
    setCurrentIndex(0);
    setScore(0);
    setIsFinished(false);
    setSelectedOption(null);
    setIsWrong(false);
    setHasFailedCurrent(false);
  };

  if (!questions || questions.length === 0) {
    return <div style={{ padding: 40, color: 'white' }}><h2>Error: No questions found.</h2></div>;
  }

  if (isFinished) {
    const finalScore = Math.round((score / totalQuestions) * 100) || 0;
    
    return (
      <SessionResult
        score={finalScore}
        onBack={onHome}
        onRestart={restart}
        practiceId={data.id}      
        practiceType="Quiz"           
        backText="Home"
        restartText="Restart"
        resultMessage="You have successfully completed the quiz session."
      />
    );
  }

  const progressPercent = Math.round(((currentIndex) / questions.length) * 100);

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: '40px 20px' }}>
      <Card variant="borderless" styles={{ body: { padding: 0 } }}>
        <Flex justify="space-between" align="center" style={{ padding: '16px 24px', borderBottom: '1px solid #f0f0f0' }}>
          <Button type="text" icon={<Home size={16} />} onClick={onHome}>EXIT</Button>
          <Space>
             {currentQuestion._retry && <Text type="danger" strong>RETRY MODE</Text>}
             <Text strong>{currentIndex + 1} / {questions.length}</Text>
          </Space>
        </Flex>
        
        <Progress percent={progressPercent} showInfo={false} strokeColor="black" size="small" shape="square" style={{lineHeight: 0}} />

        <div style={{ padding: 40 }}>
          <Title 
            level={3} 
            style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}
          >
            {renderFormattedText(currentQuestion.question)}
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
                  style={{ 
                    height: 'auto', 
                    padding: '20px', 
                    textAlign: 'left', 
                    justifyContent: 'flex-start', 
                    fontSize: '1.1rem', 
                    whiteSpace: 'normal',
                    wordBreak: 'break-word',
                    ...customStyle 
                  }}
                >
                  <Flex justify="space-between" align="center" style={{ width: '100%', gap: '10px' }}>
                     <span style={{ flex: 1 }}>{renderFormattedText(option)}</span>
                     
                     <div style={{ flexShrink: 0, display: 'flex' }}>
                       {isSelected && isCorrect && <CheckCircle size={20} />}
                       {isSelected && !isCorrect && <XCircle size={20} />}
                     </div>
                  </Flex>
                </Button>
              );
            })}
          </Flex>

          {isWrong && (
            <Alert
              message={<span style={{ fontWeight: 'bold' }}>INSIGHT</span>}
              description={renderFormattedText(currentQuestion.explanation)}
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