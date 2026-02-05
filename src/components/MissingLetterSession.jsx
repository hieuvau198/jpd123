import React, { useState, useEffect, useRef } from 'react';
import { Card, Typography, Button, Flex, Progress, Result, message } from 'antd';
import { ArrowLeft, RotateCcw } from 'lucide-react';

const { Title, Text } = Typography;

// --- UTILS ---
const shuffleArray = (array) => {
  const newArr = [...array];
  for (let i = newArr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArr[i], newArr[j]] = [newArr[j], newArr[i]];
  }
  return newArr;
};

const MissingLetterSession = ({ data, onHome, onBack }) => {
  const [queue, setQueue] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  // Game State
  const [fullWord, setFullWord] = useState("");         
  const [hiddenIndices, setHiddenIndices] = useState(new Set()); // Which indices are missing
  const [missingCount, setMissingCount] = useState(0); // How many letters are missing total
  
  // User Input is a simple string. 
  const [inputValue, setInputValue] = useState("");
  
  const [status, setStatus] = useState(""); // "", "error", "success"
  
  // Invisible input ref to capture typing
  const inputRef = useRef(null);

  // 1. Initialize & Shuffle
  useEffect(() => {
    if (data && data.questions) {
      setQueue(shuffleArray([...data.questions]));
    }
  }, [data]);

  // 2. Setup Word & Mask (Reset on card change)
  useEffect(() => {
    if (queue.length > 0 && currentIndex < queue.length) {
      const currentCard = queue[currentIndex];
      const target = (currentCard.speak || currentCard.question).trim(); 
      setFullWord(target);

      // --- NEW MASKING LOGIC ---
      const chars = target.split('');
      const validIndices = chars.map((c, i) => /[a-zA-Z]/.test(c) ? i : -1).filter(i => i !== -1);
      
      const len = validIndices.length;
      let blanksToHide = 1;

      // Rule: <= 4 -> 1, 5-7 -> 2, >7 -> 3
      if (len <= 4) blanksToHide = 1;
      else if (len <= 7) blanksToHide = 2;
      else blanksToHide = 3;

      // Safety check: don't hide more than we have
      if (blanksToHide > len) blanksToHide = len;

      const newHiddenIndices = new Set();
      // Randomly select indices
      for (let k = 0; k < blanksToHide; k++) {
        if (validIndices.length === 0) break;
        const r = Math.floor(Math.random() * validIndices.length);
        newHiddenIndices.add(validIndices[r]);
        validIndices.splice(r, 1); // remove so we don't pick again
      }

      setHiddenIndices(newHiddenIndices);
      setMissingCount(blanksToHide);
      
      // Reset State
      setInputValue("");
      setStatus("");
      
      // Auto-focus the invisible input
      setTimeout(() => {
        if (inputRef.current) inputRef.current.focus();
      }, 100);
    }
  }, [currentIndex, queue]); 

  // Focus helper
  const handleFocus = () => {
    if (inputRef.current && status === "") {
      inputRef.current.focus();
    }
  };

  const handleCheck = () => {
    if (status !== "" || inputValue.length < missingCount) return;

    // Construct the user's attempted word to verify
    let constructedWord = "";
    let inputIndex = 0;

    for (let i = 0; i < fullWord.length; i++) {
        if (hiddenIndices.has(i)) {
            constructedWord += inputValue[inputIndex] || "";
            inputIndex++;
        } else {
            constructedWord += fullWord[i];
        }
    }

    // Compare Case Insensitive
    if (constructedWord.toLowerCase() === fullWord.toLowerCase()) {
        setStatus("success");
        message.success("Correct!");
        // Success can still auto-advance, or you can remove this too if preferred.
        // Keeping it for flow as usually requested, unless explicitly asked to stop.
        setTimeout(() => handleNext(), 800);
    } else {
        setStatus("error");
        message.error("Incorrect, try again!");
        // REMOVED: setTimeout and automatic handleNext
        // REMOVED: Immediate queue update (updating queue here would trigger useEffect and reset the view)
    }
  };

  const handleNext = () => {
    // If we are moving on from an error, retry this card later (append to queue)
    if (status === 'error') {
        const currentCard = queue[currentIndex];
        setQueue(prev => [...prev, currentCard]);
    }
    setCurrentIndex(prev => prev + 1);
  };

  // Handle Input Change
  const handleChange = (e) => {
    const val = e.target.value;
    if (val.length <= missingCount && /^[a-zA-Z]*$/.test(val)) {
        setInputValue(val);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
        // If in error state, Enter acts as "Next"
        if (status === 'error') {
            handleNext();
        } else {
            handleCheck();
        }
    }
  };

  // --- FINISHED ---
  if (currentIndex >= queue.length && queue.length > 0) {
    return (
      <Flex justify="center" align="center" style={{ minHeight: '80vh' }}>
        <Result
          status="success"
          title="Session Completed!"
          subTitle={`You mastered ${data.questions.length} words.`}
          extra={[
            <Button key="home" onClick={onHome}>Home</Button>,
            <Button key="restart" type="primary" onClick={() => {
               setQueue(shuffleArray([...data.questions]));
               setCurrentIndex(0);
            }}>Restart</Button>,
          ]}
        />
      </Flex>
    );
  }

  const currentCard = queue[currentIndex] || {};
  const progressPercent = Math.round(((currentIndex) / queue.length) * 100);

  // --- RENDER WORD ---
  const renderWord = () => {
    const chars = fullWord.split('');
    let inputIndex = 0;

    return (
      <Flex wrap justify="center" gap={8} style={{ marginBottom: 30 }}>
        {chars.map((char, index) => {
          const isHidden = hiddenIndices.has(index);
          
          if (!isHidden) {
            return (
              <Text key={index} style={{ fontSize: 36, fontFamily: 'monospace' }}>
                {char}
              </Text>
            );
          } else {
            const userChar = inputValue[inputIndex] || "";
            inputIndex++;
            
            let color = '#1890ff'; 
            if (status === 'success') color = '#52c41a'; 
            if (status === 'error') color = '#ff4d4f'; 

            return (
              <div key={index} style={{ 
                  display: 'flex', 
                  flexDirection: 'column', 
                  alignItems: 'center',
                  width: 30 
              }}>
                <Text style={{ 
                    fontSize: 36, 
                    fontFamily: 'monospace', 
                    color: userChar ? color : '#ccc',
                    fontWeight: 'bold'
                }}>
                    {status === 'error' ? char : (userChar || "_")}
                </Text>
                <div style={{ 
                    width: '100%', 
                    height: 3, 
                    background: userChar ? color : '#ccc',
                    borderRadius: 2
                }} />
              </div>
            );
          }
        })}
      </Flex>
    );
  };

  return (
    <div style={{ maxWidth: 600, margin: '0 auto', padding: 20 }}>
      {/* Invisible Input for Capture */}
      <input
        ref={inputRef}
        type="text"
        value={inputValue}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        disabled={status !== ""}
        autoComplete="off"
        style={{ 
            opacity: 0, 
            position: 'absolute', 
            top: -1000, 
            pointerEvents: 'none' 
        }}
      />

      {/* HEADER */}
      <Flex justify="space-between" align="center" style={{ marginBottom: 20 }}>
        <Button icon={<ArrowLeft size={16} />} onClick={onBack}>Back</Button>
        <div style={{ width: '60%', margin: '0 10px' }}>
             <Progress percent={progressPercent} showInfo={false} size="small" />
        </div>
        <Text strong>{currentIndex + 1} / {queue.length}</Text>
      </Flex>

      {/* CLICK CARD TO FOCUS */}
      <Card 
        hoverable
        onClick={handleFocus}
        bordered={false} 
        style={{ 
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)', 
            textAlign: 'center',
            padding: '20px 0',
            cursor: 'text' 
        }}
      >
        <Text type="secondary" style={{ textTransform: 'uppercase', fontSize: 12, letterSpacing: 1 }}>
            Meaning
        </Text>
        <Title level={3} style={{ marginTop: 5, marginBottom: 40 }}>
            {currentCard.answer}
        </Title>

        {/* THE WORD DISPLAY */}
        {renderWord()}
        
        {/* INSTRUCTIONS */}
        <div style={{ minHeight: 30 }}>
            {status === 'error' ? (
                <Text type="danger" strong>Correct Answer: {fullWord}</Text>
            ) : status === 'success' ? (
                <Text type="success" strong>Correct!</Text>
            ) : (
                <Text type="secondary" style={{ fontSize: 13 }}>
                    Type the missing letters ({inputValue.length}/{missingCount})
                </Text>
            )}
        </div>
        
        <Button 
            type="primary" 
            size="large" 
            onClick={(e) => { 
                e.stopPropagation(); 
                if (status === 'error') handleNext(); // Manual Next on error
                else handleCheck(); 
            }}
            // Disable if incomplete (unless error/success state)
            // But if error, we want it ENABLED so they can click Next
            disabled={status === 'success' || (status === "" && inputValue.length < missingCount)}
            style={{ marginTop: 30, width: 200 }}
        >
            {status === 'error' ? "Next" : "Check"}
        </Button>
      </Card>
    </div>
  );
};

export default MissingLetterSession;