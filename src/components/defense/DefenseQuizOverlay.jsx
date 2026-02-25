import React, { useEffect } from 'react';
import { Button, Typography, Alert } from 'antd';

const { Title } = Typography;

const DefenseQuizOverlay = ({ currentQuestion, isWrong, selectedOption, handleAnswer }) => {
  
  // --- Keyboard Shortcuts Listener ---
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (!currentQuestion || isWrong) return;

      const key = event.key.toLowerCase();
      let optionIndex = -1;

      // Map 1, 2, 3, 4, 5 and q, w, e, r, t to indices 0 - 4
      if (key === '1' || key === 'q') optionIndex = 0;
      else if (key === '2' || key === 'w') optionIndex = 1;
      else if (key === '3' || key === 'e') optionIndex = 2;
      else if (key === '4' || key === 'r') optionIndex = 3;
      else if (key === '5' || key === 't') optionIndex = 4;

      if (optionIndex !== -1 && currentQuestion.options[optionIndex]) {
        const opt = currentQuestion.options[optionIndex];
        // Pass both option and correct boolean
        handleAnswer(opt, opt === currentQuestion.answer);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentQuestion, isWrong, handleAnswer]);

  if (!currentQuestion) return null;

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
        background: 'rgba(255, 255, 255, 0.95)',
        padding: '10px 24px',
        borderRadius: '8px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
        width: 'fit-content',
        maxWidth: '100%',
        textAlign: 'center'
      }}>
        <Title level={4} style={{ margin: 0, color: '#333' }}>
          {currentQuestion.question}
        </Title>
      </div>
      
      <div style={{ display: 'flex', gap: 10, width: '100%', justifyContent: 'center', flexWrap: 'wrap' }}>
        {currentQuestion.options.map((opt, i) => (
          <Button 
            key={i} 
            size="large" 
            onClick={() => handleAnswer(opt, opt === currentQuestion.answer)}
            disabled={isWrong}
            type={isWrong && selectedOption === opt ? 'primary' : 'default'}
            danger={isWrong && selectedOption === opt}
            style={{ 
              minWidth: 150, 
              flex: '1 1 200px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
              fontWeight: 'bold',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <span style={{ 
              background: 'rgba(0,0,0,0.1)', 
              padding: '2px 6px', 
              borderRadius: '4px', 
              fontSize: '0.8em',
              color: isWrong && selectedOption === opt ? '#fff' : '#666'
            }}>
              [{i + 1}]
            </span>
            {opt}
          </Button>
        ))}
      </div>
    </div>
  );
};

export default DefenseQuizOverlay;