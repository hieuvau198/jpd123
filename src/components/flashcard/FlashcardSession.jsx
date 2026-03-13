import React, { useState, useEffect } from 'react';
import { Card, Button, Typography, Flex, InputNumber } from 'antd';
// Added ArrowLeft to imports
import { Home, Layers, Keyboard, HelpCircle, Grid, SpellCheck, CheckSquare, ArrowLeft } from 'lucide-react'; 
import MissingLetterSession from './MissingLetterSession';
import MatchingSession from './MatchingSession'; 
import TypingSession from './TypingSession';
import SpellingBeeSession from './SpellingBeeSession';
import ViewSession from './ViewSession';
import MCSession from './MCSession';

const { Title, Text } = Typography;

const shuffleArray = (array) => {
  const newArr = [...array];
  for (let i = newArr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArr[i], newArr[j]] = [newArr[j], newArr[i]];
  }
  return newArr;
};

// Accept initialNumbers as a prop
const FlashcardSession = ({ data, onHome, initialNumbers }) => {
  const [mode, setMode] = useState(null); 
  
  const [setupMode, setSetupMode] = useState(false);
  const [sessionData, setSessionData] = useState(null);
  const [wordCount, setWordCount] = useState(30);

  useEffect(() => {
    if (data && data.questions) {
      if (initialNumbers && !isNaN(initialNumbers) && initialNumbers > 0) {
        // Automatically skip setup and choose random words if initialNumbers is valid
        const limit = Math.min(initialNumbers, data.questions.length);
        const shuffled = shuffleArray([...data.questions]);
        const selectedQuestions = shuffled.slice(0, limit);
        setSessionData({ ...data, questions: selectedQuestions });
      } else if (data.questions.length > 30) {
        // Fallback to manual setup mode
        setWordCount(30); 
        setSetupMode(true);
      } else {
        setSessionData(data); 
      }
    }
  }, [data, initialNumbers]);

  if (!data) return null;

  if (setupMode) {
    return (
      <div style={{ maxWidth: 800, margin: '0 auto', padding: 20, marginTop: 12 }}>
        <Flex justify="flex-start" style={{ marginBottom: 20 }}>
          <Button icon={<ArrowLeft size={20} />} onClick={onHome} />
        </Flex>
        <Flex vertical align="center" justify="center" style={{ minHeight: '60vh' }}>
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
        </Flex>
      </div>
    );
  }

  if (!sessionData) return null;

  if (mode === 'view') return <ViewSession data={sessionData} onHome={onHome} onBack={() => setMode(null)} />;
  if (mode === 'missing') return <MissingLetterSession data={sessionData} onHome={onHome} onBack={() => setMode(null)} />;
  if (mode === 'matching') return <MatchingSession data={sessionData} onHome={onHome} onBack={() => setMode(null)} />;
  if (mode === 'speak') return <TypingSession data={sessionData} onHome={onHome} onBack={() => setMode(null)} />;
  if (mode === 'spellingbee') return <SpellingBeeSession data={sessionData} onBack={() => setMode(null)} />;
  if (mode === 'mc') return <MCSession data={sessionData} onHome={onHome} onBack={() => setMode(null)} />; 

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto', padding: 20, marginTop: 12 }}>
              
<Flex justify="flex" style={{ marginBottom: 4, marginTop: 16 }}>
        <Button icon={<ArrowLeft size={20} />} onClick={onHome} />
      </Flex>
      
      <Flex vertical align="center" justify="center" style={{ minHeight: '60vh' }}>
        <Title level={2} style={{ marginBottom: 40 }}>{sessionData.title}</Title>
        
        <Flex wrap="wrap" gap="large" justify="center">
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

          <Card hoverable onClick={() => setMode('mc')} style={{ width: 240, textAlign: 'center' }}>
            <CheckSquare size={48} style={{ marginBottom: 16, color: '#13c2c2' }} />
            <Title level={4}>Multiple Choice</Title>
            <Text type="secondary">Choose the correct meaning.</Text>
          </Card>
        </Flex>
      </Flex>
    </div>
  );
};

export default FlashcardSession;