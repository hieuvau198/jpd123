import React, { useState, useEffect, useRef } from 'react';
import { Card, Button, Typography, Flex, Result, Space, Badge } from 'antd';
import { Home, Volume2, ArrowRight, CheckCircle, XCircle, RefreshCw } from 'lucide-react';

const { Title, Text } = Typography;

const shuffleArray = (array) => {
  const newArr = [...array];
  for (let i = newArr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArr[i], newArr[j]] = [newArr[j], newArr[i]];
  }
  return newArr;
};

const SpellingBeeSession = ({ data, onBack }) => {
  const [queue, setQueue] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [inputValue, setInputValue] = useState("");
  const [feedback, setFeedback] = useState("neutral"); // 'neutral', 'correct', 'wrong'
  const [listenCount, setListenCount] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const [score, setScore] = useState(0);

  const inputRef = useRef(null);

  // Initialize queue
  useEffect(() => {
    if (data && data.questions) {
      setQueue(shuffleArray([...data.questions]));
    }
  }, [data]);

  // Focus input when moving to a new word
  useEffect(() => {
    if (feedback === 'neutral' && inputRef.current && !isFinished) {
      inputRef.current.focus();
    }
  }, [currentIndex, feedback, isFinished]);

  const handleSpeech = (text) => {
    if (!text) return;
    if ('speechSynthesis' in window) {
      const synth = window.speechSynthesis;
      if (synth.speaking) synth.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'en-US';
      utterance.rate = 0.85; // Slightly slower for spelling
      synth.speak(utterance);
    }
  };

  // Auto-speak on new question
  useEffect(() => {
    if (queue.length > 0 && !isFinished && feedback === 'neutral') {
      const targetWord = queue[currentIndex].question;
      // Slight delay for better UX
      const timer = setTimeout(() => {
        handleSpeech(targetWord);
        setListenCount(1); // 1st listen is the auto-play
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [currentIndex, queue, isFinished]);

  const playWordAgain = () => {
    if (listenCount < 4) {
      handleSpeech(queue[currentIndex].question);
      setListenCount((prev) => prev + 1);
      if (inputRef.current) inputRef.current.focus();
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // If already answered, pushing Enter proceeds to next question
    if (feedback !== 'neutral') {
      handleNext();
      return;
    }

    if (!inputValue.trim()) return;

    const currentCard = queue[currentIndex];
    const target = currentCard.question.toLowerCase().trim();
    const input = inputValue.toLowerCase().trim();

    if (input === target) {
      setFeedback('correct');
      setScore(prev => prev + 1);
    } else {
      setFeedback('wrong');
    }
  };

  const handleNext = () => {
    if (currentIndex + 1 < queue.length) {
      setCurrentIndex((prev) => prev + 1);
      setInputValue("");
      setFeedback('neutral');
      setListenCount(0);
    } else {
      setIsFinished(true);
    }
  };

  const restart = () => {
    setQueue(shuffleArray([...data.questions]));
    setCurrentIndex(0);
    setScore(0);
    setIsFinished(false);
    setInputValue("");
    setFeedback('neutral');
    setListenCount(0);
  };

  // --- COMPLETED SCREEN ---
  if (isFinished) {
    return (
      <Flex justify="center" align="center" style={{ minHeight: '80vh', padding: 20 }}>
        <Card style={{ width: '100%', maxWidth: 500, textAlign: 'center' }}>
          <Result
            icon={<CheckCircle size={60} color="#52c41a" />}
            status="success"
            title="Spelling Bee Complete!"
            subTitle="Great job practicing your spelling."
            extra={[
              <div key="score" style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: 20 }}>
                Score: {score} / {queue.length}
              </div>,
              <Button key="home" icon={<Home size={16}/>} onClick={onBack}>Exit</Button>,
              <Button key="restart" type="primary" icon={<RefreshCw size={16}/>} onClick={restart}>Restart</Button>
            ]}
          />
        </Card>
      </Flex>
    );
  }

  if (!queue.length) return null;

  const currentCard = queue[currentIndex];

  return (
    <div style={{ maxWidth: 600, margin: '0 auto', padding: 20 }}>
      <Flex justify="space-between" align="center" style={{ marginBottom: 20 }}>
        <Button icon={<Home size={16} />} onClick={onBack}>Exit</Button>
        <Space>
           <Text strong>SPELLING BEE</Text>
           <Text type="secondary">|</Text>
           <Text strong>{currentIndex + 1} / {queue.length}</Text>
        </Space>
      </Flex>

      <Card style={{ textAlign: 'center', padding: '40px 20px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
        
        <Flex justify="center" align="center" style={{ marginBottom: 30 }}>
          <Badge count={4 - listenCount} showZero color={listenCount >= 4 ? '#ff4d4f' : '#1890ff'} offset={[-5, 5]}>
            <Button 
              type="primary" 
              shape="circle" 
              size="large"
              icon={<Volume2 size={32} />} 
              onClick={playWordAgain}
              disabled={listenCount >= 4 || feedback !== 'neutral'}
              style={{ width: 80, height: 80 }}
            />
          </Badge>
        </Flex>

        <Text type="secondary" style={{ display: 'block', marginBottom: 20 }}>
          {listenCount >= 4 ? "No listens remaining" : "Listen to the word and type it below"}
        </Text>

        <form onSubmit={handleSubmit} style={{ marginBottom: 20 }}>
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Type the word here..."
            disabled={feedback !== 'neutral'}
            autoComplete="off"
            spellCheck="false"
            style={{
              width: '100%', maxWidth: 400, padding: '12px 15px', fontSize: 20, 
              textAlign: 'center', borderRadius: 8, outline: 'none',
              border: feedback === 'correct' ? '2px solid #52c41a' : 
                      feedback === 'wrong' ? '2px solid #ff4d4f' : '1px solid #d9d9d9',
              backgroundColor: feedback === 'neutral' ? '#fff' : '#f5f5f5',
            }}
          />
          {feedback === 'neutral' && (
            <div style={{ marginTop: 20 }}>
              <Button type="primary" htmlType="submit" size="large" style={{ minWidth: 120 }}>
                Check
              </Button>
            </div>
          )}
        </form>

        {/* Feedback Section */}
        {feedback !== 'neutral' && (
          <div style={{ 
            marginTop: 30, padding: 20, borderRadius: 8,
            backgroundColor: feedback === 'correct' ? '#f6ffed' : '#fff1f0',
            border: feedback === 'correct' ? '1px solid #b7eb8f' : '1px solid #ffa39e'
          }}>
            <Title level={4} style={{ color: feedback === 'correct' ? '#52c41a' : '#ff4d4f', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 0 }}>
              {feedback === 'correct' ? <CheckCircle /> : <XCircle />}
              {feedback === 'correct' ? "Correct!" : "Incorrect"}
            </Title>
            
            <div style={{ margin: '15px 0' }}>
              <Text type="secondary">Word:</Text><br/>
              <Text strong style={{ fontSize: 22 }}>{currentCard.question}</Text>
            </div>

            <div style={{ margin: '15px 0' }}>
              <Text type="secondary">Definition:</Text><br/>
              <Text strong style={{ fontSize: 18 }}>{currentCard.answer}</Text>
            </div>

            <Button 
              type={feedback === 'correct' ? "primary" : "primary"}
              danger={feedback === 'wrong'}
              size="large" 
              onClick={handleNext}
              style={{ marginTop: 10, minWidth: 150 }}
              autoFocus // Auto focuses Next button so Enter key works seamlessly
            >
              Next <ArrowRight size={16} style={{ marginLeft: 8 }} />
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
};

export default SpellingBeeSession;