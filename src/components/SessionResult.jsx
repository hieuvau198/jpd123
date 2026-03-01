import React from 'react';
import { Button, Typography, Flex, Card } from 'antd';
import { ALL_LEVELS, getRatingInfo } from './flashcard/flashcardConstants';

const { Title, Text } = Typography;

const SessionResult = ({ score, onBack, onRestart, backText = "Back to Menu", restartText = "Play Again" }) => {
  // Logic remains the same for every mode
  const rating = getRatingInfo(score);

  return (
    <Flex justify="center" align="center" style={{ minHeight: '80vh', padding: '40px 0' }}>
      <Flex vertical align="center" gap="large" style={{ marginTop: 20 }}>
        
        {/* Bigger image in a square shape (borderRadius: 16 gives it slightly rounded square corners) */}
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

        <Title level={2}>Điểm: {score}/100</Title>
        <Title level={3} style={{ color: rating.color, margin: 0 }}>Danh Hiệu: {rating.title}</Title>

        {/* Buttons displayed directly instead of using the Antd <Result extra={...}> array */}
        <Flex gap="middle" style={{ marginTop: 20 }}>
          <Button size="large" onClick={onBack}>
            {backText}
          </Button>
          <Button size="large" type="primary" onClick={onRestart}>
            {restartText}
          </Button>
        </Flex>

        {/* Rank Levels Display */}
        <div style={{ marginTop: 30, textAlign: 'center' }}>
          <Text strong style={{ fontSize: 16, display: 'block', marginBottom: 16 }}>
            Bảng Xếp Hạng
          </Text>
          <Flex gap="middle" wrap justify="center">
            {ALL_LEVELS.map(lvl => (
              <Card 
                key={lvl.title} 
                size="small" 
                style={{ 
                  width: 120, 
                  opacity: rating.title === lvl.title ? 1 : 0.5, 
                  textAlign: 'center' 
                }}
              >
                <img 
                  src={lvl.img} 
                  alt={lvl.title} 
                  style={{ 
                    width: 60, 
                    height: 60, 
                    objectFit: 'cover', 
                    borderRadius: 8, // Made these square as well to match the main image theme
                    marginBottom: 8 
                  }} 
                />
                <div style={{ lineHeight: '1.2' }}>
                  <Text strong>{lvl.title}</Text>
                </div>
                <div style={{ marginTop: 4 }}>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    {lvl.min === lvl.max ? '100' : `${lvl.min}-${lvl.max}`}
                  </Text>
                </div>
              </Card>
            ))}
          </Flex>
        </div>

      </Flex>
    </Flex>
  );
};

export default SessionResult;