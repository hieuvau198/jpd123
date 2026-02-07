import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Home, RefreshCw, Volume2, ArrowRight } from 'lucide-react';
import { Card, Button, Typography, Progress, Result, Flex, Space } from 'antd';

const { Text } = Typography;

const shuffleArray = (array) => {
  const newArr = [...array];
  for (let i = newArr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArr[i], newArr[j]] = [newArr[j], newArr[i]];
  }
  return newArr;
};

const ListenSession = ({ data, onHome }) => {
  const prepareListenData = (originalData) => {
    const rawQuestions = Array.isArray(originalData) 
      ? originalData.flatMap(d => d.questions) 
      : (originalData.questions || []);
    if (rawQuestions.length === 0) return [];
    
    return shuffleArray(rawQuestions).map(q => {
      const shuffledOptions = shuffleArray(q.options);
      const randomTarget = shuffledOptions[Math.floor(Math.random() * shuffledOptions.length)];
      return {
        ...q,
        options: shuffledOptions,
        speakTarget: randomTarget,
        _tempId: Math.random().toString(36).substr(2, 9),
      };
    });
  };

  const [questions, setQuestions] = useState(() => prepareListenData(data));
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const [selectedOption, setSelectedOption] = useState(null);
  const [isWrong, setIsWrong] = useState(false);
  const [hasFailedCurrent, setHasFailedCurrent] = useState(false);

  const currentQuestion = questions[currentIndex];
  const progressPercent = Math.round(((currentIndex) / questions.length) * 100);

  const handleSpeech = (text) => {
    if (!text) return;
    if ('speechSynthesis' in window) {
      const synth = window.speechSynthesis;
      if (synth.speaking) synth.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'en-US';
      utterance.rate = 0.9;
      synth.speak(utterance);
    }
  };

  useEffect(() => {
    if (!isFinished && currentQuestion) {
      setTimeout(() => handleSpeech(currentQuestion.speakTarget), 500);
    }
  }, [currentIndex, isFinished, currentQuestion]);

  const handleOptionClick = (option) => {
    if (isWrong) return;
    setSelectedOption(option);

    const cleanOption = String(option).trim();
    const cleanTarget = String(currentQuestion.speakTarget).trim();

    if (cleanOption === cleanTarget) {
      if (!hasFailedCurrent) setScore(prev => prev + 1);
      setTimeout(handleNext, 500);
    } else {
      setIsWrong(true);
      if (!hasFailedCurrent) {
        setHasFailedCurrent(true);
        // Retry logic: Add to end of queue
        const retryQuestion = { ...currentQuestion, _retry: true };
        const newTarget = retryQuestion.options[Math.floor(Math.random() * retryQuestion.options.length)];
        retryQuestion.speakTarget = newTarget;
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
    setQuestions(prepareListenData(data));
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
        total={questions.length}
        onHome={onHome} 
        onRestart={restart} 
        title="Listening Practice Complete" 
      />
    );
  }

  if (!questions.length) return <div style={{ padding: 40, color: 'white' }}>Error: No questions found.</div>;

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: '40px 20px' }}>
      <Card bordered={false} bodyStyle={{ padding: 0 }}>
        <Header 
          mode="Listen" 
          currentIndex={currentIndex} 
          total={questions.length} 
          onHome={onHome} 
          hasFailed={hasFailedCurrent} 
        />
        <Progress percent={progressPercent} showInfo={false} strokeColor="#eb2f96" size="small" shape="square" style={{ lineHeight: 0 }} />
        
        <div style={{ padding: 40 }}>
          <Flex align="center" justify="center" style={{ marginBottom: 30, minHeight: 100 }}>
            <Button 
                type="primary" 
                shape="circle" 
                size="large"
                icon={<Volume2 size={32} />} 
                onClick={() => handleSpeech(currentQuestion.speakTarget)}
                style={{ width: 80, height: 80, backgroundColor: '#eb2f96', borderColor: '#eb2f96', boxShadow: '0 4px 12px rgba(235, 47, 150, 0.3)' }}
            />
          </Flex>

          <Flex vertical gap="middle">
            {currentQuestion.options.map((option, idx) => {
              const isSelected = selectedOption === option;
              const isCorrect = option === currentQuestion.speakTarget;
              
              let customStyle = {};
              if (isSelected && isCorrect) { 
                customStyle = { backgroundColor: '#eb2f96', color: 'white', borderColor: '#eb2f96' }; 
              } else if (isSelected && !isCorrect) { 
                customStyle = { color: '#ff4d4f', borderColor: '#ff4d4f', backgroundColor: '#fff1f0' }; 
              }

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

          {/* Simple Continue Button appearing when wrong, replacing the Explanation Alert */}
          {isWrong && (
             <div style={{ marginTop: 30, textAlign: 'center' }}>
                <Button 
                  type="primary" 
                  size="large" 
                  onClick={handleNext} 
                  style={{ background: '#eb2f96', borderColor: '#eb2f96', minWidth: 150 }}
                >
                  Continue <ArrowRight size={16} style={{ marginLeft: 8 }} />
                </Button>
             </div>
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
        icon={<CheckCircle size={60} color="#eb2f96" />}
        status="success"
        title={title}
        subTitle="You have completed the listening session."
        extra={[
           <div key="score" style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: 20 }}>
             Score: {score}
           </div>,
           <Button key="home" icon={<Home size={16}/>} onClick={onHome}>Home</Button>,
           <Button key="restart" type="primary" icon={<RefreshCw size={16}/>} onClick={onRestart} style={{ background: '#eb2f96', borderColor: '#eb2f96' }}>Restart</Button>
        ]}
      />
    </Card>
  </Flex>
);

export default ListenSession;