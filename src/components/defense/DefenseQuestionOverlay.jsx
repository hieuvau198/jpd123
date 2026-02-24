import React from 'react';
import { Button, Typography, Alert } from 'antd';

const { Title } = Typography;

const DefenseQuestionOverlay = ({ currentQuestion, isWrong, selectedOption, handleAnswer }) => {
  if (!currentQuestion) return null;

  return (
    <div style={{
      position: 'absolute',
      bottom: '5%',
      left: '50%',
      transform: 'translateX(-50%)',
      // The background and blur are completely removed here
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
      
      {/* Made the text white with a drop shadow so it stands out against the dark map */}
      <Title level={4} style={{ margin: 0, textAlign: 'center', color: 'white', textShadow: '2px 2px 4px rgba(0,0,0,0.8)' }}>
        {currentQuestion.question}
      </Title>
      
      <div style={{ display: 'flex', gap: 10, width: '100%', justifyContent: 'center', flexWrap: 'wrap' }}>
        {currentQuestion.options.map((opt, i) => (
          <Button 
            key={i} 
            size="large" 
            onClick={() => handleAnswer(opt)}
            disabled={isWrong}
            type={isWrong && selectedOption === opt ? 'primary' : 'default'}
            danger={isWrong && selectedOption === opt}
            style={{ 
              minWidth: 150, 
              flex: '1 1 200px',
              // Added a slight shadow to the buttons so they pop against the background
              boxShadow: '0 4px 12px rgba(0,0,0,0.4)' 
            }}
          >
            {opt}
          </Button>
        ))}
      </div>
    </div>
  );
};

export default DefenseQuestionOverlay;