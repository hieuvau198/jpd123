import React from 'react';
import { Card, Typography } from 'antd';

const { Text } = Typography;

const MCOptionsGrid = ({ options, selectedAnswer, correctAnswer, handleAnswerClick }) => {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '20px' }}>
      {options.map((opt, idx) => {
        let bgColor = '#fff', borderColor = '#d9d9d9', textColor = '#333';
        if (selectedAnswer !== null) {
          if (opt === correctAnswer) {
            bgColor = '#f6ffed'; borderColor = '#b7eb8f'; textColor = '#52c41a';
          } else if (opt === selectedAnswer) {
            bgColor = '#fff2f0'; borderColor = '#ffccc7'; textColor = '#f5222d';
          }
        }
        
        return (
          <Card
            key={idx}
            hoverable={selectedAnswer === null}
            onClick={() => handleAnswerClick(opt)}
            style={{
              cursor: selectedAnswer === null ? 'pointer' : 'default',
              backgroundColor: bgColor, borderColor: borderColor, transition: 'all 0.3s ease',
              borderRadius: 12, height: '100%', minHeight: '120px'
            }}
            bodyStyle={{
              padding: '20px', height: '100%', display: 'flex', alignItems: 'center',
              justifyContent: 'center', textAlign: 'center'
            }}
          >
            <Text strong style={{ fontSize: '1.1rem', color: textColor }}>{opt}</Text>
          </Card>
        );
      })}
    </div>
  );
};

export default MCOptionsGrid;