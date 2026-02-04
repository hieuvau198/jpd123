import React, { useState, useEffect, useRef } from 'react';
import { Card, Button, Typography, Flex, Space, Result } from 'antd';
// Added 'Grid' to imports
import { Home, Layers, Keyboard, HelpCircle, Grid, ArrowRightLeft, RotateCcw, ArrowLeft, ArrowRight } from 'lucide-react';
import MissingLetterSession from './MissingLetterSession';
import MatchingSession from './MatchingSession'; // <--- IMPORT NEW COMPONENT

const { Title, Text } = Typography;

// ... (Keep existing helper functions: removeVietnameseTones, shuffleArray) ...
// ... (Make sure removeVietnameseTones and shuffleArray are still defined here) ...
const removeVietnameseTones = (str) => {
  if (!str) return "";
  str = str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  str = str.replace(/đ/g, "d").replace(/Đ/g, "D");
  return str.toLowerCase().trim();
};

const shuffleArray = (array) => {
  const newArr = [...array];
  for (let i = newArr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArr[i], newArr[j]] = [newArr[j], newArr[i]];
  }
  return newArr;
};

const FlashcardSession = ({ data, onHome }) => {
  const [mode, setMode] = useState(null); 
  const [direction, setDirection] = useState(null); 
  
  // Basic Session State
  const [queue, setQueue] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [feedback, setFeedback] = useState("neutral");
  const [correctAnswerDisplay, setCorrectAnswerDisplay] = useState("");
  const inputRef = useRef(null);

  useEffect(() => {
    if (data && data.questions) {
      setQueue(shuffleArray([...data.questions]));
    }
  }, [data]);

  // ... (Keep existing Focus and Keyboard effects) ...

  useEffect(() => {
    if (mode === 'speak' && direction && feedback !== 'wrong' && inputRef.current) {
      inputRef.current.focus();
    }
  }, [currentIndex, mode, direction, feedback]);

  useEffect(() => {
    if (mode !== 'view') return;
    const handleKeyDown = (e) => {
      if (e.code === 'Space') {
        e.preventDefault();
        setIsFlipped(prev => !prev);
      } else if (e.code === 'ArrowRight') handleNext();
      else if (e.code === 'ArrowLeft') handlePrev();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [mode, currentIndex]);

  const handleNext = () => {
    if (currentIndex < queue.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setIsFlipped(false);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
      setIsFlipped(false);
    }
  };

  const handleSpeakSubmit = (e) => {
     // ... (Keep existing logic) ...
    e.preventDefault();
    if (feedback !== 'neutral') return;

    const currentCard = queue[currentIndex];
    const userAns = inputValue; 
    let isCorrect = false;
    let correctString = "";

    if (direction === 'vi_en') {
      const target = (currentCard.speak || "").toLowerCase().trim();
      const input = userAns.toLowerCase().trim();
      isCorrect = input === target;
      correctString = currentCard.speak;
    } else {
      const rawAnswers = (currentCard.answer || "").split('/');
      const input = removeVietnameseTones(userAns);
      isCorrect = rawAnswers.some(ans => removeVietnameseTones(ans) === input);
      correctString = currentCard.answer;
    }

    if (isCorrect) {
      setFeedback('correct');
      setTimeout(() => {
        setFeedback('neutral');
        setInputValue("");
        if (currentIndex < queue.length - 1) setCurrentIndex(prev => prev + 1);
        else setCurrentIndex(prev => prev + 1); 
      }, 800);
    } else {
      setFeedback('wrong');
      setCorrectAnswerDisplay(correctString);
      setTimeout(() => {
        setQueue(prev => [...prev, currentCard]);
        setFeedback('neutral');
        setCorrectAnswerDisplay("");
        setInputValue("");
        setCurrentIndex(prev => prev + 1);
      }, 2500);
    }
  };

  if (!data) return null;

  // --- RENDER MODES ---

  if (mode === 'missing') {
    return <MissingLetterSession data={data} onHome={onHome} onBack={() => setMode(null)} />;
  }

  // >>> NEW MATCHING MODE <<<
  if (mode === 'matching') {
    return <MatchingSession data={data} onHome={onHome} onBack={() => setMode(null)} />;
  }

  // --- MAIN MENU ---
  if (!mode) {
    return (
      <Flex vertical align="center" justify="center" style={{ padding: 40, minHeight: '80vh' }}>
        <Title level={2}>{data.title}</Title>
        <Text type="secondary" style={{ marginBottom: 40 }}>{data.description}</Text>
        
        <Flex wrap gap="large" justify="center">
          <Card 
            hoverable 
            onClick={() => setMode('view')}
            style={{ width: 240, textAlign: 'center' }}
          >
            <Layers size={48} style={{ marginBottom: 16, color: '#1890ff' }} />
            <Title level={4}>Flashcard</Title>
            <Text type="secondary">Flip cards to learn.</Text>
          </Card>
          
          <Card 
            hoverable 
            onClick={() => setMode('speak')}
            style={{ width: 240, textAlign: 'center' }}
          >
            <Keyboard size={48} style={{ marginBottom: 16, color: '#52c41a' }} />
            <Title level={4}>Typing</Title>
            <Text type="secondary">Type the full answer.</Text>
          </Card>

          <Card 
            hoverable 
            onClick={() => setMode('missing')}
            style={{ width: 240, textAlign: 'center' }}
          >
            <HelpCircle size={48} style={{ marginBottom: 16, color: '#faad14' }} />
            <Title level={4}>Missing Letter</Title>
            <Text type="secondary">Fill in the blank.</Text>
          </Card>

          {/* >>> NEW MATCHING CARD <<< */}
          <Card 
            hoverable 
            onClick={() => setMode('matching')}
            style={{ width: 240, textAlign: 'center' }}
          >
            <Grid size={48} style={{ marginBottom: 16, color: '#722ed1' }} />
            <Title level={4}>Matching</Title>
            <Text type="secondary">Pair words & meanings.</Text>
          </Card>

        </Flex>

        <Button type="text" icon={<Home size={16} />} onClick={onHome} style={{ marginTop: 40 }}>
          Back to Home
        </Button>
      </Flex>
    );
  }

  // ... (Keep existing Direction Menu, Completed Screen, Flashcard View, Typing View) ...
  // (Paste the rest of the file content here as it was, no changes needed below this point)

  // --- TYPING DIRECTION MENU ---
  if (mode === 'speak' && !direction) {
    return (
      <Flex vertical align="center" justify="center" style={{ padding: 40, minHeight: '80vh' }}>
        <Title level={3} style={{ marginBottom: 30 }}>Select Mode</Title>
        <Space direction="horizontal" size="large">
          <Card hoverable onClick={() => setDirection('vi_en')} style={{ width: 300, textAlign: 'center' }}>
            <ArrowRightLeft size={32} style={{ marginBottom: 10 }} />
            <Title level={5}>VN → EN</Title>
            <Text>See Vietnamese, Type English</Text>
          </Card>
          <Card hoverable onClick={() => setDirection('en_vi')} style={{ width: 300, textAlign: 'center' }}>
            <ArrowRightLeft size={32} style={{ marginBottom: 10 }} />
            <Title level={5}>EN → VN</Title>
            <Text>See English, Type Vietnamese</Text>
          </Card>
        </Space>
        <Button onClick={() => setMode(null)} style={{ marginTop: 30 }}>Cancel</Button>
      </Flex>
    );
  }

  // --- COMPLETED SCREEN ---
  if (currentIndex >= queue.length && mode !== 'matching' && mode !== 'missing') {
    // Note: I added mode checks above just in case, but usually matching returns its own view
    return (
        <Flex justify="center" align="center" style={{ minHeight: '80vh' }}>
        <Result
          status="success"
          title="Session Completed!"
          extra={[
            <Button key="home" onClick={onHome}>Home</Button>,
            <Button key="restart" type="primary" onClick={() => {
               setQueue(shuffleArray([...data.questions]));
               setCurrentIndex(0);
               setDirection(null); 
               setMode(null);
            }}>Restart</Button>,
          ]}
        />
      </Flex>
    );
  }

  const currentCard = queue[currentIndex];

  // --- FLASHCARD VIEW ---
  if (mode === 'view') {
    return (
      <div style={{ maxWidth: 600, margin: '0 auto', padding: '40px 20px' }}>
        <Flex justify="space-between" align="center" style={{ marginBottom: 20 }}>
          <Button ghost icon={<Home size={16}/>} onClick={onHome} style={{ color: 'white' }}>Exit</Button>
          <Text strong style={{ color: 'white' }}>{currentIndex + 1} / {queue.length}</Text>
        </Flex>

        {/* 3D Flip Container using classes from simplified App.css */}
        <div 
           className="perspective-container" 
           onClick={() => setIsFlipped(!isFlipped)} 
           style={{ height: 350, cursor: 'pointer', marginBottom: 30 }}
        >
          <div className={`card-inner ${isFlipped ? 'flipped' : ''}`}>
            
            {/* FRONT */}
            <Card className="card-front" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Flex vertical align="center" gap="small">
                 <Title level={2}>{currentCard.question}</Title>
                 <Text type="secondary">Click or Space to Flip</Text>
              </Flex>
            </Card>

            {/* BACK */}
            <Card className="card-back" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', border: '3px solid black' }}>
               <Flex vertical align="center" gap="small">
                  <Title level={2} style={{ color: '#1890ff' }}>{currentCard.speak}</Title>
                  <Title level={4}>{currentCard.answer}</Title>
               </Flex>
            </Card>

          </div>
        </div>

        <Flex justify="center" gap="middle">
          <Button size="large" icon={<ArrowLeft size={16} />} onClick={(e) => {e.stopPropagation(); handlePrev()}} disabled={currentIndex === 0}>Prev</Button>
          <Button size="large" icon={<RotateCcw size={16} />} onClick={(e) => {e.stopPropagation(); setIsFlipped(!isFlipped)}}>Flip</Button>
          <Button size="large" icon={<ArrowRight size={16} />} iconPosition='end' onClick={(e) => {e.stopPropagation(); handleNext()}} disabled={currentIndex === queue.length - 1}>Next</Button>
        </Flex>
      </div>
    );
  }

  // --- TYPING VIEW ---
  // ... (same as original)
  const displayQuestion = direction === 'vi_en' ? currentCard.answer : currentCard.speak;
  const inputPlaceholder = direction === 'vi_en' ? "Type English..." : "Type Vietnamese...";
  
  return (
    <div style={{ maxWidth: 600, margin: '0 auto', padding: 20 }}>
      <Flex justify="space-between" align="center" style={{ marginBottom: 20 }}>
         <Button icon={<Home size={16}/>} onClick={() => { setDirection(null); setMode(null); }}>Exit</Button>
         <Text strong>{currentIndex + 1} / {queue.length}</Text>
      </Flex>

      <Card style={{ textAlign: 'center', padding: 40, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
        <Title level={2} style={{ marginBottom: 10 }}>{displayQuestion}</Title>
        <Text type="secondary" style={{ display: 'block', marginBottom: 30 }}>
            {direction === 'vi_en' ? "Enter the English word" : "Enter the Vietnamese meaning"}
        </Text>

        {feedback === 'wrong' ? (
           <div style={{ padding: 20, background: '#fff1f0', border: '1px solid #ffa39e', borderRadius: 8, color: '#cf1322' }}>
              <Text strong>Correct Answer: {correctAnswerDisplay}</Text>
           </div>
        ) : (
          <form onSubmit={handleSpeakSubmit}>
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder={inputPlaceholder}
              disabled={feedback !== 'neutral'}
              autoComplete="off"
              style={{
                width: '100%', maxWidth: 400, padding: '10px 15px', fontSize: 18, 
                borderRadius: 6, border: feedback === 'correct' ? '2px solid #52c41a' : '1px solid #d9d9d9',
                outline: 'none'
              }}
            />
          </form>
        )}
        
        {feedback === 'correct' && <Title level={4} type="success" style={{ marginTop: 20 }}>Correct!</Title>}
      </Card>
    </div>
  );
};

export default FlashcardSession;