import React, { useEffect, useMemo } from 'react';
import { Button, Typography, Alert } from 'antd';

const { Title } = Typography;

const DefenseFlashcardOverlay = ({ currentWord, allWords, isWrong, selectedOption, handleAnswer }) => {
  
  // Randomize choices for the flashcard (1 correct meaning + 2 random distractors)
  const options = useMemo(() => {
    if (!currentWord || !allWords) return [];
    
    // FIX: Support both 'answer' and 'meaning'
    const correctMeaning = currentWord.answer || currentWord.meaning;
    
    // FIX: Support both 'answer' and 'meaning'
    const otherMeanings = Array.from(new Set(allWords
      .map(w => w.answer || w.meaning)
      .filter(m => m && m !== correctMeaning) // ensure m is defined
    ));
    
    // Shuffle and pick 2
    const shuffledOthers = otherMeanings.sort(() => 0.5 - Math.random());
    const distractors = shuffledOthers.slice(0, 2);
    
    // Combine and shuffle the options
    const combined = [correctMeaning, ...distractors].sort(() => 0.5 - Math.random());
    return combined;
  }, [currentWord, allWords]);

  // --- Keyboard Shortcuts Listener ---
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (!currentWord || isWrong) return;

      const key = event.key.toLowerCase();
      let optionIndex = -1;

      if (key === '1' || key === 'q') optionIndex = 0;
      else if (key === '2' || key === 'w') optionIndex = 1;
      else if (key === '3' || key === 'e') optionIndex = 2;

      if (optionIndex !== -1 && options[optionIndex]) {
        const opt = options[optionIndex];
        // FIX: Compare with both 'answer' and 'meaning'
        const isCorrect = opt === (currentWord.answer || currentWord.meaning);
        handleAnswer(opt, isCorrect);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentWord, isWrong, handleAnswer, options]);

  if (!currentWord) return null;
  
  // FIX: Support both 'question' and 'word' for the display text
  const displayText = currentWord.question || currentWord.word;

  return (
    <div style={{
      position: 'absolute',
      top: '45%', 
      left: '50%',
      transform: 'translate(-50%, -50%)',
      background: 'transparent', 
      padding: '20px 30px',
      zIndex: 100,
      width: '90%',
      maxWidth: '800px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '15px'
    }}>
      {isWrong && (
        <Alert 
          message="Missed! Aim carefully!" 
          type="error" 
          showIcon 
          style={{ position: 'absolute', top: '-45px', left: '50%', transform: 'translateX(-50%)', padding: '2px 15px' }} 
        />
      )}
      
      <div style={{
        background: 'rgba(104, 255, 235, 0.95)',
        padding: '10px 24px',
        borderRadius: '8px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
        width: 'fit-content',
        maxWidth: '100%',
        textAlign: 'center'
      }}>
        <Title level={4} style={{ margin: 0, color: '#333' }}>
          {displayText}
        </Title>
      </div>
      
      {/* UPDATE THIS DIV FOR TOP-DOWN LAYOUT */}
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column', /* This forces items to stack vertically */
        gap: 12, 
        width: '100%', 
        alignItems: 'center'     /* Centers the buttons horizontally */
      }}>
        {options.map((opt, i) => (
          <Button 
            key={i} 
            size="large" 
            onClick={() => handleAnswer(opt, opt === (currentWord.answer || currentWord.meaning))}
            disabled={isWrong}
            type={isWrong && selectedOption === opt ? 'primary' : 'default'}
            danger={isWrong && selectedOption === opt}
            style={{ 
              width: '30%',         /* Make buttons uniform width */
              maxWidth: '400px',     /* Prevent them from getting too wide on large screens */
              minHeight: '50px',     /* Give them a bit more height for readability */
              boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
              fontWeight: 'bold',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              gap: '8px',
              whiteSpace: 'normal',  /* Allow text to wrap if the meaning is long */
              height: 'auto',        /* Let height adjust based on text */
              padding: '10px 15px'
            }}
          >
            
            <span>{opt}</span>
          </Button>
        ))}
      </div>
    </div>
  );
};

export default DefenseFlashcardOverlay;