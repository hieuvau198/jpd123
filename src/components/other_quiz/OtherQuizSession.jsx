import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Home, Brain, ArrowRight } from 'lucide-react';
import { Card, Button, Typography, Progress, Alert, Flex, Space, Row, Col } from 'antd';
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
        <Card style={{ width: '100%', maxWidth: 500, textAlign: 'center' }}>
          <Title level={3}>Select number of questions</Title>
          <Text>This practice has {rawCount} questions. How many would you like to answer?</Text>
          <Flex justify="center" gap="middle" wrap="wrap" style={{ marginTop: 24 }}>
            {intervals.map(num => (
              <Button key={num} size="large" onClick={() => handleStart(num)}>
                {num} Questions
              </Button>
            ))}
            <Button size="large" type="primary" onClick={() => handleStart(rawCount)}>
              All ({rawCount})
            </Button>
          </Flex>
          <div style={{ marginTop: 24 }}>
            <Button icon={<Home size={16}/>} onClick={onHome}>Back</Button>
          </div>
        </Card>
      </Flex>
    );
  }

  if (!queue && queue.length === 0 && !isFinished) {
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
        practiceType="Quiz" // Keep it as Quiz if you want it to trigger the mission logic           
        backText="Home"
        restartText="Restart"
        resultMessage="You have successfully completed the practice session!"
      />
    );
  }

  const progressPercent = Math.round((completedCount / totalQuestions) * 100);

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: '40px 20px' }}>
      <Card variant="borderless" styles={{ body: { padding: 0 } }}>
        <Flex justify="space-between" align="center" style={{ padding: '16px 24px', borderBottom: '1px solid #f0f0f0' }}>
          <Button type="text" icon={<Home size={16} />} onClick={onHome}>EXIT</Button>
          <Space>
             {!currentQuestion._firstTry && <Text type="warning" strong>REVISION ({currentQuestion._timesToCorrect} left)</Text>}
             <Text strong>{completedCount} / {totalQuestions}</Text>
          </Space>
        </Flex>
        
        <Progress percent={progressPercent} showInfo={false} strokeColor="black" size="small" shape="square" style={{lineHeight: 0}} />

        <div style={{ padding: 40 }}>
          <Title level={3} style={{ whiteSpace: 'pre-wrap' }}>
            {renderFormattedText(currentQuestion.question)}
          </Title>
          
          {/* Row and Col replace the old vertical flex logic for options and explanations */}
          <Row gutter={[32, 32]} style={{ marginTop: 30 }}>
            {/* Options Column */}
            <Col xs={24} lg={isWrong ? 14 : 24}>
              <Flex vertical gap="middle">
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
                         <span>{renderFormattedText(option)}</span>
                         {isSelected && isCorrect && <CheckCircle size={20} />}
                         {isSelected && !isCorrect && <XCircle size={20} />}
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
                  message={<span style={{ fontWeight: 'bold' }}>Explain: </span>}
                  description={
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      <div>{renderFormattedText(currentQuestion.explanation)}</div>
                      <Button type="primary" style={{ background: 'black', alignSelf: 'flex-start' }} onClick={() => processNextStep(false)}>
                        NEXT <ArrowRight size={16} />
                      </Button>
                    </div>
                  }
                  type="info"
                  showIcon
                  icon={<Brain size={24} />}
                  style={{ borderColor: 'black', background: '#f8f9fa', height: '100%' }}
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