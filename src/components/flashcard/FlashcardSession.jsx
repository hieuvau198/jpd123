import React, { useState, useEffect } from 'react';
import { Card, Button, Typography, Flex, Result, InputNumber } from 'antd';
import { Home, Layers, Keyboard, HelpCircle, Grid, ArrowLeft, ArrowRight, Volume2, SpellCheck } from 'lucide-react';
import MissingLetterSession from './MissingLetterSession';
import MatchingSession from './MatchingSession'; 
import TypingSession from './TypingSession';
import SpellingBeeSession from './SpellingBeeSession';
import { ALL_LEVELS, getRatingInfo } from './flashcardConstants';

const { Title, Text } = Typography;

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
  
  const [setupMode, setSetupMode] = useState(false);
  const [sessionData, setSessionData] = useState(null);
  const [wordCount, setWordCount] = useState(30);
  
  const [queue, setQueue] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (data && data.questions) {
      if (data.questions.length > 30) {
        setWordCount(30); 
        setSetupMode(true);
      } else {
        setSessionData(data); 
      }
    }
  }, [data]);

  useEffect(() => {
    if (sessionData && sessionData.questions) {
      setQueue(shuffleArray([...sessionData.questions]));
    }
  }, [sessionData]);

  useEffect(() => {
    if (mode !== 'view') return;
    const handleKeyDown = (e) => {
      if (e.code === 'Space') {
        e.preventDefault();
        if (queue[currentIndex]) {
          handleSpeech(queue[currentIndex].question);
        }
      } else if (e.code === 'ArrowRight') handleNext();
      else if (e.code === 'ArrowLeft') handlePrev();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [mode, currentIndex, queue]);

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

  const handleNext = () => {
    if (currentIndex < queue.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      setCurrentIndex(prev => prev + 1); // Trigger complete screen
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    }
  };

  if (!data) return null;

  if (setupMode) {
    return (
      <Flex vertical align="center" justify="center" style={{ padding: 40, minHeight: '80vh' }}>
        <Title level={2}>{data.title}</Title>
        <Text type="secondary" style={{ marginBottom: 20 }}>
          This set has {data.questions.length} words. How many would you like to practice today?
        </Text>
        
        <Flex gap="small" align="center" style={{ marginBottom: 30 }}>
          <InputNumber 
            min={1} 
            max={data.questions.length} 
            value={wordCount} 
            onChange={(val) => setWordCount(val || 1)} 
            size="large"
          />
          <Text>words</Text>
        </Flex>

        <Button 
          type="primary" 
          size="large" 
          onClick={() => {
            const shuffled = shuffleArray([...data.questions]);
            const selectedQuestions = shuffled.slice(0, wordCount);
            setSessionData({ ...data, questions: selectedQuestions });
            setSetupMode(false);
          }}
        >
          Start Practice
        </Button>

        <Button type="text" icon={<Home size={16} />} onClick={onHome} style={{ marginTop: 20 }}>
          Back to Home
        </Button>
      </Flex>
    );
  }

  if (!sessionData) return null;

  if (mode === 'missing') return <MissingLetterSession data={sessionData} onHome={onHome} onBack={() => setMode(null)} />;
  if (mode === 'matching') return <MatchingSession data={sessionData} onHome={onHome} onBack={() => setMode(null)} />;
  if (mode === 'speak') return <TypingSession data={sessionData} onHome={onHome} onBack={() => setMode(null)} />;
  if (mode === 'spellingbee') return <SpellingBeeSession data={sessionData} onBack={() => setMode(null)} />;

  if (!mode) {
    return (
      <Flex vertical align="center" justify="center" style={{ padding: 40, minHeight: '80vh' }}>
        <Title level={2}>{sessionData.title}</Title>
        <Text type="secondary" style={{ marginBottom: 40 }}>
          {sessionData.description} (Practicing {sessionData.questions.length} words)
        </Text>
        
        <Flex wrap gap="large" justify="center">
          <Card hoverable onClick={() => setMode('view')} style={{ width: 240, textAlign: 'center' }}>
            <Layers size={48} style={{ marginBottom: 16, color: '#1890ff' }} />
            <Title level={4}>Flashcard</Title>
            <Text type="secondary">View and Listen.</Text>
          </Card>
          
          <Card hoverable onClick={() => setMode('speak')} style={{ width: 240, textAlign: 'center' }}>
            <Keyboard size={48} style={{ marginBottom: 16, color: '#52c41a' }} />
            <Title level={4}>Typing</Title>
            <Text type="secondary">Type the full answer.</Text>
          </Card>

          <Card hoverable onClick={() => setMode('missing')} style={{ width: 240, textAlign: 'center' }}>
            <HelpCircle size={48} style={{ marginBottom: 16, color: '#faad14' }} />
            <Title level={4}>Missing Letter</Title>
            <Text type="secondary">Fill in the blank.</Text>
          </Card>

          <Card hoverable onClick={() => setMode('matching')} style={{ width: 240, textAlign: 'center' }}>
            <Grid size={48} style={{ marginBottom: 16, color: '#722ed1' }} />
            <Title level={4}>Matching</Title>
            <Text type="secondary">Pair words & meanings.</Text>
          </Card>

          <Card hoverable onClick={() => setMode('spellingbee')} style={{ width: 240, textAlign: 'center' }}>
            <SpellCheck size={48} style={{ marginBottom: 16, color: '#eb2f96' }} />
            <Title level={4}>Spelling Bee</Title>
            <Text type="secondary">Listen and spell the word.</Text>
          </Card>
        </Flex>

        <Button type="text" icon={<Home size={16} />} onClick={onHome} style={{ marginTop: 40 }}>
          Back to Home
        </Button>
      </Flex>
    );
  }

  // --- COMPLETED SCREEN FOR FLASHCARD VIEW ---
  if (currentIndex >= queue.length && mode === 'view') {
    const score = 100; // Viewing flashcards doesn't have "mistakes", so automatic perfect!
    const rating = getRatingInfo(score);

    return (
      <Flex justify="center" align="center" style={{ minHeight: '80vh', padding: '40px 0' }}>
        <Result
          status="success"
          title="Session Completed!"
          subTitle="You have successfully reviewed all the flashcards."
          extra={[
            <Button key="menu" onClick={() => setMode(null)}>Back to Menu</Button>, 
            <Button key="restart" type="primary" onClick={() => {
               setQueue(shuffleArray([...sessionData.questions]));
               setCurrentIndex(0);
               setMode(null);
            }}>Restart</Button>,
          ]}
        >
          <Flex vertical align="center" gap="large" style={{ marginTop: 20 }}>
            <Title level={3}>Your Score: {score}/100</Title>
            <Title level={4} style={{ color: rating.color, margin: 0 }}>Rank: {rating.title}</Title>
            <img src={rating.img} alt={rating.title} style={{ width: 150, height: 150, objectFit: 'cover', borderRadius: '50%', boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }} />

            <div style={{ marginTop: 30, textAlign: 'center' }}>
              <Text strong style={{ fontSize: 16, display: 'block', marginBottom: 16 }}>All Rank Levels</Text>
              <Flex gap="middle" wrap justify="center">
                {ALL_LEVELS.map(lvl => (
                  <Card key={lvl.title} size="small" style={{ width: 120, opacity: rating.title === lvl.title ? 1 : 0.5, textAlign: 'center' }}>
                    <img src={lvl.img} alt={lvl.title} style={{ width: 60, height: 60, objectFit: 'cover', borderRadius: '50%', marginBottom: 8 }} />
                    <div style={{ lineHeight: '1.2' }}><Text strong>{lvl.title}</Text></div>
                    <div style={{ marginTop: 4 }}><Text type="secondary" style={{ fontSize: 12 }}>{lvl.min === lvl.max ? '100 pts' : `${lvl.min}-${lvl.max} pts`}</Text></div>
                  </Card>
                ))}
              </Flex>
            </div>
          </Flex>
        </Result>
      </Flex>
    );
  }

  const currentCard = queue[currentIndex];

  if (mode === 'view') {
    return (
      <div style={{ maxWidth: 600, margin: '0 auto', padding: '40px 20px' }}>
        <Flex justify="space-between" align="center" style={{ marginBottom: 20 }}>
          <Button ghost icon={<Home size={16}/>} onClick={() => setMode(null)} style={{ color: '#555' }}>Exit</Button>
          <Text strong>{currentIndex + 1} / {queue.length}</Text>
        </Flex>

        <Card 
          hoverable
          onClick={() => handleSpeech(currentCard.question)}
          style={{ 
            minHeight: 350, 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            marginBottom: 30,
            cursor: 'pointer',
            textAlign: 'center'
          }}
        >
          <Flex vertical align="center" gap="large">
            <Flex align="center" gap="small">
              <Title level={2} style={{ color: '#1890ff', margin: 0 }}>
                {currentCard.question}
              </Title>
              <Volume2 size={24} style={{ color: '#1890ff' }} />
            </Flex>
            
            <Title level={4} type="secondary">
              {currentCard.answer}
            </Title>
            
            <Text type="secondary" style={{ marginTop: 20, fontSize: 12 }}>
              Click or Space to Listen
            </Text>
          </Flex>
        </Card>

        <Flex justify="center" gap="middle">
          <Button size="large" icon={<ArrowLeft size={16} />} onClick={(e) => {e.stopPropagation(); handlePrev()}} disabled={currentIndex === 0}>Prev</Button>
          <Button size="large" icon={<Volume2 size={16} />} onClick={(e) => {e.stopPropagation(); handleSpeech(currentCard.question);}}>Listen</Button>
          <Button size="large" icon={<ArrowRight size={16} />} iconPosition='end' onClick={(e) => {e.stopPropagation(); handleNext()}}>Next</Button>
        </Flex>
      </div>
    );
  }

  return null;
};

export default FlashcardSession;