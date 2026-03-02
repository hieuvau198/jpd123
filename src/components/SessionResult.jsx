import React from 'react';
import { Button, Typography, Flex, Card } from 'antd';
import { ALL_LEVELS, getRatingInfo } from './flashcard/flashcardConstants';

const { Title, Text } = Typography;

// Add resultMessage to props
const SessionResult = ({ score, onBack, onRestart, backText = "Back to Menu", restartText = "Play Again", resultMessage }) => {
  const rating = getRatingInfo(score);

  return (
    <Flex justify="center" align="center" gap={80} wrap="wrap" style={{ minHeight: '80vh', padding: '40px 20px' }}>
      
      {/* Left Side: Score & Actions */}
      <Flex vertical align="center" gap="large">
        <img 
          src={rating.img} 
          alt={rating.title} 
          style={{ 
              width: 350, 
              height: 350, 
              objectFit: 'cover', 
              borderRadius: 16, 
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)' 
            }} 
        />

        <Title level={2} style={{ margin: 0 }}>Score: {score}/100</Title>
        <Title level={3} style={{ color: rating.color, margin: 0 }}>Rank: {rating.title}</Title>
        
        {/* Render the result message if it exists */}
        {resultMessage && (
          <Text style={{ fontSize: 18, marginTop: 10, textAlign: 'center', maxWidth: 400, color: '#555' }}>
            {resultMessage}
          </Text>
        )}

        <Flex gap="middle" style={{ marginTop: 20 }}>
          <Button size="large" onClick={onBack}>
            {backText}
          </Button>
          <Button size="large" type="primary" onClick={onRestart}>
            {restartText}
          </Button>
        </Flex>
      </Flex>

      {/* Right Side: Ranking List (Top-Down) */}
      <Flex vertical gap="middle" align="center">
        <Text strong style={{ fontSize: 20, display: 'block', marginBottom: 8 }}>
          Ranking Levels
        </Text>
        <Flex vertical gap="small" style={{ maxHeight: '600px', overflowY: 'auto', paddingRight: 10 }}>
          {ALL_LEVELS.map(lvl => (
            <Card 
              key={lvl.title} 
              size="small" 
              style={{ 
                width: 250, 
                opacity: rating.title === lvl.title ? 1 : 0.5,
                borderColor: rating.title === lvl.title ? '#1677ff' : '#f0f0f0',
                backgroundColor: rating.title === lvl.title ? '#f0f5ff' : '#ffffff'
              }}
            >
              <Flex align="center" gap="middle">
                <img 
                  src={lvl.img} 
                  alt={lvl.title} 
                  style={{ 
                    width: 50, 
                    height: 50, 
                    objectFit: 'cover', 
                    borderRadius: 8
                  }} 
                />
                <Flex vertical>
                  <Text strong>{lvl.title}</Text>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    {lvl.min === lvl.max ? '100' : `${lvl.min}-${lvl.max}`} pts
                  </Text>
                </Flex>
              </Flex>
            </Card>
          ))}
        </Flex>
      </Flex>

    </Flex>
  );
};

export default SessionResult;