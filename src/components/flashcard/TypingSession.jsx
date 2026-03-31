import React, { useState, useEffect, useRef } from 'react';
import { Card, Button, Typography, Flex, Space } from 'antd';
import { ArrowLeft, ArrowRightLeft, Volume2 } from 'lucide-react';
import SessionResult from '../SessionResult'; // Imported SessionResult

const { Title, Text } = Typography;

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

const TypingSession = ({ data, onHome, onBack }) => {
  const [direction, setDirection] = useState(null); 
  const [queue, setQueue] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [inputValue, setInputValue] = useState("");
  const [feedback, setFeedback] = useState("neutral");
  const [correctAnswerDisplay, setCorrectAnswerDisplay] = useState("");
  const inputRef = useRef(null);
  
  // Track unique IDs of questions the user got wrong
  const [wrongIds, setWrongIds] = useState(new Set());

  useEffect(() => {
    if (data && data.questions) {
      // Initialize queue with correctAttemptsNeeded = 1 for each question
      setQueue(shuffleArray([...data.questions]).map(q => ({ ...q, correctAttemptsNeeded: 1 })));
    }
  }, [data]);

  useEffect(() => {
    if (direction && feedback !== 'wrong' && inputRef.current) {
      inputRef.current.focus();
    }
  }, [currentIndex, direction, feedback]);

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

  const handleSpeakSubmit = (e) => {
    e.preventDefault();
    if (feedback !== 'neutral') return;

    const currentCard = queue[currentIndex];
    const userAns = inputValue; 
    let isCorrect = false;
    let correctString = "";

    if (direction === 'vi_en') {
      const target = (currentCard.question || "").toLowerCase().trim();
      const input = userAns.toLowerCase().trim();
      isCorrect = input === target;
      correctString = currentCard.question;
    } else {
      const rawAnswers = (currentCard.answer || "").split('/');
      const input = removeVietnameseTones(userAns);
      isCorrect = rawAnswers.some(ans => removeVietnameseTones(ans) === input);
      correctString = currentCard.answer;
    }

    if (isCorrect) {
      setFeedback('correct');
      handleSpeech(currentCard.question);
      setTimeout(() => {
        setFeedback('neutral');
        setInputValue("");
        
        const remainingAttempts = (currentCard.correctAttemptsNeeded || 1) - 1;
        
        if (remainingAttempts > 0) {
          // They got it right, but they failed it previously, so they need to see it one last time
          setQueue(prev => {
            const newQueue = [...prev];
            const updatedCard = { ...currentCard, correctAttemptsNeeded: remainingAttempts };
            // Insert 3 positions ahead (meaning after exactly 2 questions)
            const insertPos = Math.min(currentIndex + 3, newQueue.length);
            newQueue.splice(insertPos, 0, updatedCard);
            return newQueue;
          });
        }

        setCurrentIndex(prev => prev + 1); 
      }, 800);
    } else {
      setFeedback('wrong');
      handleSpeech(currentCard.question);
      setCorrectAnswerDisplay(correctString);
      // Mark this question as wrong (using question text or ID as unique key)
      setWrongIds(prev => new Set(prev).add(currentCard.id || currentCard.question));
    }
  };

  const handleManualNext = () => {
    const currentCard = queue[currentIndex];
    
    // Reset correct attempts to 2 because they got it wrong
    setQueue(prev => {
      const newQueue = [...prev];
      const updatedCard = { ...currentCard, correctAttemptsNeeded: 2 };
      // Re-insert exactly after 2 questions (index + 3)
      const insertPos = Math.min(currentIndex + 3, newQueue.length);
      newQueue.splice(insertPos, 0, updatedCard);
      return newQueue;
    });

    setFeedback('neutral');
    setCorrectAnswerDisplay("");
    setInputValue("");
    setCurrentIndex(prev => prev + 1);
  };

  if (!direction) {
    return (
      <Flex vertical align="center" justify="center" style={{ padding: '20px', minHeight: '80vh' }}>
        <Title level={3} style={{ marginBottom: 30 }}>Select Mode</Title>
        <Flex wrap="wrap" gap="large" justify="center" style={{ width: '100%' }}>
          <Card hoverable onClick={() => setDirection('vi_en')} style={{ width: '100%', maxWidth: 300, textAlign: 'center' }}>
            <ArrowRightLeft size={32} style={{ marginBottom: 10 }} />
            <Title level={5}>VN → EN</Title>
            <Text>See Vietnamese, Type English</Text>
          </Card>
          <Card hoverable onClick={() => setDirection('en_vi')} style={{ width: '100%', maxWidth: 300, textAlign: 'center' }}>
            <ArrowRightLeft size={32} style={{ marginBottom: 10 }} />
            <Title level={5}>EN → VN</Title>
            <Text>See English, Type Vietnamese</Text>
          </Card>
        </Flex>
        <Button onClick={onBack} style={{ marginTop: 30 }}>Cancel</Button>
      </Flex>
    );
  }

  // Use the new SessionResult when completed
  if (currentIndex >= queue.length) {
    const totalUniqueQuestions = data.questions.length;
    const score = Math.max(0, Math.round(((totalUniqueQuestions - wrongIds.size) / totalUniqueQuestions) * 100));

    return (
      <SessionResult 
        score={score} 
        resultMessage={`"${data?.title || 'current'}": Type ${totalUniqueQuestions} words!`}
        onBack={onBack} 
        onRestart={() => {
           setQueue(shuffleArray([...data.questions]).map(q => ({ ...q, correctAttemptsNeeded: 1 })));
           setCurrentIndex(0);
           setWrongIds(new Set());
           setDirection(null); 
        }} 
        practiceId={data.id} // Pass the flashcard ID
        practiceType="Flashcard"      // Tell it this is a flashcard
        practiceName={data.title} // Add this line
      />
    );
  }

  const currentCard = queue[currentIndex];
  const displayQuestion = direction === 'vi_en' ? currentCard.answer : currentCard.question;
  const inputPlaceholder = direction === 'vi_en' ? "Type English..." : "Type Vietnamese...";

  return (
    <div style={{ maxWidth: 600, margin: '0 auto', padding: 20, marginTop: 12 }}>
      <Flex justify="space-between" align="center" style={{ marginBottom: 20, marginTop: 30 }}>
         <Button icon={<ArrowLeft size={20}/>} onClick={onBack} />
         <Text strong>{currentIndex + 1} / {queue.length}</Text>
      </Flex>

      <Card style={{ textAlign: 'center', padding: 40, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
        <Flex justify="center" align="center" gap="small" style={{ marginBottom: 10 }}>
            <Title level={2} style={{ margin: 0 }}>{displayQuestion}</Title>
            <Button 
              type="text" 
              shape="circle" 
              icon={<Volume2 size={24} />} 
              onClick={() => handleSpeech(currentCard.question)}
            />
        </Flex>

        <Text type="secondary" style={{ display: 'block', marginBottom: 30 }}>
            {direction === 'vi_en' ? "Enter the English word" : "Enter the Vietnamese meaning"}
        </Text>

        {feedback === 'wrong' ? (
           <div style={{ padding: 20, background: '#fff1f0', border: '1px solid #ffa39e', borderRadius: 8, color: '#cf1322', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 15 }}>
              <Text strong style={{ fontSize: 18 }}>Correct Answer: {correctAnswerDisplay}</Text>
              <Button type="primary" danger onClick={handleManualNext}>Next Question</Button>
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

export default TypingSession;