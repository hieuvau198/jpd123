// src/components/flashcard/spellingbee/SpellingBeeMC.jsx
import React from 'react';
import { Button, Row, Col } from 'antd';

const SpellingBeeMC = ({ options, selectedOption, correctAnswer, onSelectOption, disabled }) => {
  return (
    <Row gutter={[12, 12]}>
      {options.map((option, idx) => {
        const isSelected = selectedOption === option;
        const isCorrect = option === correctAnswer;

        let customStyle = {
          height: 56,
          fontSize: '1.1rem',
          fontWeight: 600,
          borderRadius: 12,
          borderWidth: '2px',
          borderColor: '#e8e8e8',
          backgroundColor: '#fff',
          color: '#262626',
          transition: 'all 0.2s ease',
          boxShadow: '0 2px 4px rgba(0,0,0,0.03)',
        };

        if (selectedOption !== null) {
          if (isCorrect) {
            customStyle = {
              ...customStyle,
              backgroundColor: '#f6ffed',
              borderColor: '#52c41a',
              color: '#389e0d',
            };
          } else if (isSelected && !isCorrect) {
            customStyle = {
              ...customStyle,
              backgroundColor: '#fff1f0',
              borderColor: '#ff4d4f',
              color: '#cf1322',
            };
          } else {
            customStyle = {
              ...customStyle,
              opacity: 0.5,
            };
          }
        }

        return (
          <Col xs={24} sm={12} key={idx}>
            <Button
              block
              size="large"
              style={customStyle}
              onClick={() => onSelectOption(option)}
              disabled={disabled}
            >
              {option}
            </Button>
          </Col>
        );
      })}
    </Row>
  );
};

export default SpellingBeeMC;