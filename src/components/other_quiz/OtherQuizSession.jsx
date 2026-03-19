import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Home, Brain, ArrowRight } from 'lucide-react';
import { Card, Button, Typography, Progress, Alert, Flex, Space, Row, Col, Tag } from 'antd';
import SessionResult from '../SessionResult';

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

  // Add tracking states: 
  // _firstTry: dictates if it counts towards the score
  // _timesToCorrect: dictates how many correct attempts are needed to clear the question
  return shuffledQuestions.map(q => ({
    ...q,
    correctAnswer: q.correctAnswer || q.answer, 
    _tempId: Math.random().toString(36).substr(2, 9), 
    _firstTry: true,
    _timesToCorrect: 1, 
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

const OtherQuizSession = ({ data, onHome, initialNumbers }) => {
  const rawQuestions = Array.isArray(data) ? data.flatMap(d => d.questions) : (data.questions || []);
  const rawCount = rawQuestions.length;

  const [limit, setLimit] = useState(initialNumbers || (rawCount <= 30 ? rawCount : null));
  const [hasStarted, setHasStarted] = useState(rawCount <= 30 || initialNumbers !== null);

  // queue is used to power the spaced-repetition logic
  const [queue, setQueue] = useState(() => hasStarted ? prepareSessionData(data, limit) : []);
  const [totalQuestions, setTotalQuestions] = useState(() => hasStarted ? queue.length : 0);
  
  const [completedCount, setCompletedCount] = useState(0);
  const [score, setScore] = useState(0); // Score tracks ONLY first-time correct answers
  
  const [isFinished, setIsFinished] = useState(false);
  const [selectedOption, setSelectedOption] = useState(null);
  const [isWrong, setIsWrong] = useState(false);

  const currentQuestion = queue[0];

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!hasStarted || isFinished || isWrong || (selectedOption && currentQuestion && selectedOption === currentQuestion.correctAnswer)) return;
      
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
  }, [hasStarted, isFinished, isWrong, selectedOption, currentQuestion]);

  const handleOptionClick = (option) => {
    if (isWrong) return; 
    setSelectedOption(option);

    const cleanOption = String(option).trim();
    const cleanAnswer = String(currentQuestion.correctAnswer).trim();
    const isCorrect = cleanOption === cleanAnswer;

    if (isCorrect) {
      // Score only increments if this is the user's first time seeing this question
      if (currentQuestion._firstTry) {
        setScore((prev) => prev + 1);
      }
      setTimeout(() => processNextStep(true), 500); 
    } else {
      setIsWrong(true);
      // Wait for user to click NEXT manually
    }
  };

  const processNextStep = (wasCorrect) => {
    setQueue(prevQueue => {
      const newQueue = [...prevQueue];
      const q = newQueue.shift(); // take out the current question

      if (wasCorrect) {
        q._timesToCorrect -= 1;
        
        if (q._timesToCorrect > 0) {
          // Send to the very end of the line
          newQueue.push(q);
        } else {
          // Finished this question entirely
          setCompletedCount(c => c + 1);
        }
      } else {
        q._firstTry = false;
        q._timesToCorrect = 2; // Needs 2 correct answers to clear
        
        // Appear again after max 2 questions (insert at index 2 or end of array)
        const insertIndex = Math.min(2, newQueue.length);
        newQueue.splice(insertIndex, 0, q);
      }

      if (newQueue.length === 0) {
        setIsFinished(true);
      }
      
      return newQueue;
    });

    setSelectedOption(null);
    setIsWrong(false);
  };

  const handleStart = (selectedLimit) => {
    const prepped = prepareSessionData(data, selectedLimit);
    setLimit(selectedLimit);
    setQueue(prepped);
    setTotalQuestions(prepped.length);
    setHasStarted(true);
  };

  const restart = () => {
    const prepped = prepareSessionData(data, limit);
    setQueue(prepped);
    setCompletedCount(0);
    setScore(0);
    setIsFinished(false);
    setSelectedOption(null);
    setIsWrong(false);
  };

  if (!hasStarted) {
    const intervals = [10, 20, 30, 40, 50].filter(n => n < rawCount);
    return (
      <Flex justify="center" align="center" style={{ minHeight: '80vh', padding: 20 }}>
        <Card style={{ width: '100%', maxWidth: 540, textAlign: 'center', borderRadius: 16, boxShadow: '0 8px 24px rgba(0,0,0,0.06)' }} bordered={false}>
          <Title level={3} style={{ marginBottom: 8 }}>Practice Length</Title>
          <Flex justify="center" gap="middle" wrap="wrap" style={{ marginTop: 32, marginBottom: 32 }}>
            {intervals.map(num => (
              <Button key={num} size="large" shape="round" onClick={() => handleStart(num)}>
                {num} Questions
              </Button>
            ))}
            <Button size="large" type="primary" shape="round" style={{ background: '#141414', borderColor: '#141414' }} onClick={() => handleStart(rawCount)}>
              All ({rawCount})
            </Button>
          </Flex>
          <div>
            <Button type="text" icon={<Home size={18}/>} onClick={onHome}>Back to Home</Button>
          </div>
        </Card>
      </Flex>
    );
  }

  if (!queue && queue.length === 0 && !isFinished) {
    return <div style={{ padding: 40, textAlign: 'center' }}><Title level={3}>Error: No questions found.</Title></div>;
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
        resultMessage="You have successfully completed the practice session!"
      />
    );
  }

  const progressPercent = Math.round((completedCount / totalQuestions) * 100);

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '40px 20px' }}>
      <Card 
        bordered={false} 
        style={{ borderRadius: 16, boxShadow: '0 10px 30px rgba(0,0,0,0.05)', overflow: 'hidden' }} 
        styles={{ body: { padding: 0 } }}
      >
        <Flex justify="space-between" align="center" style={{ padding: '20px 32px', backgroundColor: '#fafafa', borderBottom: '1px solid #f0f0f0' }}>
          <Button type="text" icon={<Home size={18} />} onClick={onHome} style={{ color: '#595959', fontWeight: 500 }}>EXIT</Button>
          <Space size="large">
             {!currentQuestion._firstTry && (
               <Tag color="warning" style={{ borderRadius: 12, padding: '2px 12px', fontSize: '0.9rem', fontWeight: 600 }}>
                 REVISION ({currentQuestion._timesToCorrect} left)
               </Tag>
             )}
             <Text strong style={{ fontSize: '1rem', color: '#262626' }}>{completedCount} / {totalQuestions}</Text>
          </Space>
        </Flex>
        
        <Progress percent={progressPercent} showInfo={false} strokeColor="#141414" trailColor="#f0f0f0" size="small" shape="square" style={{ lineHeight: 0, margin: 0 }} />

        <div style={{ padding: '40px 48px' }}>
          <Title level={4} style={{ whiteSpace: 'pre-wrap', lineHeight: 1.6, color: '#1f1f1f', fontWeight: 600 }}>
            {renderFormattedText(currentQuestion.question)}
          </Title>
          
          <Row gutter={[40, 40]} style={{ marginTop: 40 }}>
            {/* Options Column */}
            <Col xs={24} lg={isWrong ? 14 : 24}>
              <Flex vertical gap="16px">
                {currentQuestion.options.map((option, idx) => {
                  const isSelected = selectedOption === option;
                  const isCorrect = option === currentQuestion.correctAnswer;
                  
                  // Base Styles for options
                  let customStyle = {
                    height: 'auto',
                    minHeight: '64px',
                    padding: '16px 24px',
                    textAlign: 'left',
                    fontSize: '1.05rem',
                    borderRadius: '12px',
                    transition: 'all 0.2s ease',
                    whiteSpace: 'normal',
                    lineHeight: 1.5,
                    boxShadow: '0 2px 0 rgba(0,0,0,0.015)'
                  };

                  // Dynamic Styles based on correctness and selection
                  if (isSelected && isCorrect) {
                    customStyle = { ...customStyle, backgroundColor: '#141414', color: '#ffffff', borderColor: '#141414' };
                  } else if (isSelected && !isCorrect) {
                    customStyle = { ...customStyle, backgroundColor: '#fff1f0', color: '#cf1322', borderColor: '#ffa39e' };
                  } else if (isWrong && isCorrect) {
                    customStyle = { ...customStyle, backgroundColor: '#f6ffed', color: '#389e0d', borderColor: '#b7eb8f', borderWidth: 2 };
                  } else if (isWrong || (selectedOption && isCorrect)) {
                    customStyle = { ...customStyle, backgroundColor: '#fcfcfc', color: '#bfbfbf', borderColor: '#f0f0f0', boxShadow: 'none' };
                  } else {
                    customStyle = { ...customStyle, backgroundColor: '#ffffff', color: '#262626' };
                  }

                  return (
                    <Button
                      key={idx}
                      block
                      onClick={() => handleOptionClick(option)}
                      disabled={isWrong || (selectedOption && isCorrect)}
                      style={customStyle}
                    >
                      <Flex justify="space-between" align="center" style={{ width: '100%', gap: '16px' }}>
                         <span style={{ flex: 1 }}>{renderFormattedText(option)}</span>
                         {isSelected && isCorrect && <CheckCircle size={22} />}
                         {isSelected && !isCorrect && <XCircle size={22} />}
                         {isWrong && isCorrect && !isSelected && <CheckCircle size={22} color="#52c41a" />}
                      </Flex>
                    </Button>
                  );
                })}
              </Flex>
            </Col>

            {/* Explanation Column */}
            {isWrong && (
              <Col xs={24} lg={10}>
                <Alert
                  message={<span style={{ fontWeight: '600', fontSize: '1.1rem', color: '#1f1f1f' }}>Explanation</span>}
                  description={
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginTop: '12px' }}>
                      <div style={{ color: '#434343', fontSize: '1rem', lineHeight: 1.6 }}>
                        {renderFormattedText(currentQuestion.explanation)}
                      </div>
                      <Button 
                        type="primary" 
                        size="large"
                        style={{ background: '#141414', borderColor: '#141414', alignSelf: 'flex-start', borderRadius: '8px', padding: '0 24px' }} 
                        onClick={() => processNextStep(false)}
                      >
                        Continue <ArrowRight size={18} />
                      </Button>
                    </div>
                  }
                  type="info"
                  showIcon
                  icon={<Brain size={28} color="#141414" style={{ marginTop: '4px' }} />}
                  style={{ borderRadius: '16px', border: '1px solid #e8e8e8', background: '#fbfbfb', padding: '24px', height: '100%' }}
                />
              </Col>
            )}
          </Row>
        </div>
      </Card>
    </div>
  );
};

export default OtherQuizSession;