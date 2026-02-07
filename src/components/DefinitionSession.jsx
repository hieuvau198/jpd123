import React, { useState } from 'react';
import { CheckCircle, XCircle, Home, RefreshCw, Brain, ArrowRight } from 'lucide-react';
import { Card, Button, Typography, Progress, Result, Alert, Flex, Space } from 'antd';

const { Text } = Typography;

const shuffleArray = (array) => {
  const newArr = [...array];
  for (let i = newArr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArr[i], newArr[j]] = [newArr[j], newArr[i]];
  }
  return newArr;
};

const DefinitionSession = ({ data, onHome }) => {
  const prepareDefinitionData = (originalData) => {
    const rawQuestions = Array.isArray(originalData) 
      ? originalData.flatMap(d => d.questions) 
      : (originalData.questions || []);
    if (rawQuestions.length === 0) return [];

    return shuffleArray(rawQuestions).map(q => ({
      ...q,
      options: shuffleArray(q.options),
      _tempId: Math.random().toString(36).substr(2, 9),
    }));
  };

  const [questions, setQuestions] = useState(() => prepareDefinitionData(data));
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const [selectedOption, setSelectedOption] = useState(null);
  const [isWrong, setIsWrong] = useState(false);
  
  // New state to track if the user failed the current question
  const [hasFailedCurrent, setHasFailedCurrent] = useState(false);

  const currentQuestion = questions[currentIndex];
  const progressPercent = Math.round(((currentIndex) / questions.length) * 100);

  const handleOptionClick = (option) => {
    if (selectedOption || isWrong) return;
    setSelectedOption(option);

    const isCorrect = option === currentQuestion.correctAnswer;
    
    if (isCorrect) {
      // Only add score if they haven't failed this specific question instance yet
      if (!hasFailedCurrent) {
        setScore(prev => prev + 1);
      }
      setTimeout(handleNext, 800);
    } else {
      setIsWrong(true);
      
      // If this is the first time failing this question, add it to the end of the queue
      if (!hasFailedCurrent) {
        setHasFailedCurrent(true);
        const retryQuestion = { ...currentQuestion, _retry: true };
        // We reshuffle options for the retry to make it slightly different
        retryQuestion.options = shuffleArray(retryQuestion.options);
        setQuestions(prev => [...prev, retryQuestion]);
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
    setQuestions(prepareDefinitionData(data));
    setCurrentIndex(0);
    setScore(0);
    setIsFinished(false);
    setSelectedOption(null);
    setIsWrong(false);
    setHasFailedCurrent(false);
  };

  if (isFinished) {
    return (
      <CompletionScreen 
        score={score} 
        onHome={onHome} 
        onRestart={restart} 
        title="Definition Practice Complete" 
      />
    );
  }

  if (!questions.length) return <div style={{ padding: 40, color: 'white' }}>Error: No questions found.</div>;

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: '40px 20px' }}>
      <Card bordered={false} bodyStyle={{ padding: 0 }}>
        <Header 
            mode="Definition" 
            currentIndex={currentIndex} 
            total={questions.length} 
            onHome={onHome} 
            hasFailed={hasFailedCurrent}
        />
        <Progress percent={progressPercent} showInfo={false} strokeColor="#1890ff" size="small" shape="square" style={{ lineHeight: 0 }} />
        
        <div style={{ padding: 40 }}>
          <div style={{ marginBottom: 30, minHeight: 80, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <Text style={{ fontSize: '1.2rem', fontWeight: 500, textAlign: 'center' }}>
              {currentQuestion.question}
            </Text>
          </div>

          <Flex vertical gap="middle">
            {currentQuestion.options.map((option, idx) => {
              const isSelected = selectedOption === option;
              const isCorrectAnswer = option === currentQuestion.correctAnswer;
              
              let customStyle = {};
              let showIcon = null;

              if (isSelected && isCorrectAnswer) {
                 customStyle = { backgroundColor: '#52c41a', color: 'white', borderColor: '#52c41a' };
                 showIcon = <CheckCircle size={20} />;
              } else if (isSelected && !isCorrectAnswer) {
                 customStyle = { color: '#ff4d4f', borderColor: '#ff4d4f', backgroundColor: '#fff1f0' };
                 showIcon = <XCircle size={20} />;
              } else if (isWrong && isCorrectAnswer) {
                 customStyle = { borderColor: '#52c41a', color: '#52c41a', backgroundColor: '#f6ffed' };
                 showIcon = <CheckCircle size={20} />;
              }

              return (
                <Button
                  key={idx}
                  size="large"
                  block
                  onClick={() => handleOptionClick(option)}
                  disabled={selectedOption !== null}
                  style={{ height: 'auto', padding: '20px', textAlign: 'left', justifyContent: 'flex-start', fontSize: '1.1rem', ...customStyle }}
                >
                  <Flex justify="space-between" align="center" style={{ width: '100%' }}>
                     <span>{option}</span>
                     {showIcon}
                  </Flex>
                </Button>
              );
            })}
          </Flex>

          {isWrong && (
            <Alert
              message={<span style={{ fontWeight: 'bold' }}>EXPLANATION</span>}
              description={currentQuestion.explanation || "Review the correct answer above."}
              type="info"
              showIcon
              icon={<Brain size={24} />}
              style={{ marginTop: 30, borderColor: '#1890ff', background: '#e6f7ff' }}
              action={
                <Button type="primary" style={{ background: '#1890ff', borderColor: '#1890ff' }} onClick={handleNext}>
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

// --- Local Helpers ---
const Header = ({ mode, currentIndex, total, onHome, hasFailed }) => (
  <Flex justify="space-between" align="center" style={{ padding: '16px 24px', borderBottom: '1px solid #f0f0f0' }}>
    <Button type="text" icon={<Home size={16} />} onClick={onHome}>EXIT</Button>
    <Space>
       {hasFailed && <Text type="danger" strong>RETRY</Text>}
       <Text strong>{mode.toUpperCase()}</Text>
       <Text type="secondary">|</Text>
       <Text strong>{currentIndex + 1} / {total}</Text>
    </Space>
  </Flex>
);

const CompletionScreen = ({ score, onHome, onRestart, title }) => (
  <Flex justify="center" align="center" style={{ minHeight: '80vh', padding: 20 }}>
    <Card style={{ width: '100%', maxWidth: 500, textAlign: 'center' }}>
      <Result
        icon={<CheckCircle size={60} color="#52c41a" />}
        status="success"
        title={title}
        subTitle="You have completed the definition check."
        extra={[
           <div key="score" style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: 20 }}>
             Score: {score}
           </div>,
           <Button key="home" icon={<Home size={16}/>} onClick={onHome}>Home</Button>,
           <Button key="restart" type="primary" icon={<RefreshCw size={16}/>} onClick={onRestart}>Restart</Button>
        ]}
      />
    </Card>
  </Flex>
);

export default DefinitionSession;