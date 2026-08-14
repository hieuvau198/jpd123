// src/components/flashcard/spellingbee/SpellingBeeMC.jsx
import React from 'react';
import { Button, Row, Col } from 'antd';

const SpellingBeeMC = ({ options, selectedOption, correctAnswer, onSelectOption, disabled }) => {
  return (
    <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
      {options.map((option, idx) => {
        const isSelected = selectedOption === option;
        const isCorrect = option === correctAnswer;

        let customStyle = {
          height: 'auto',
          minHeight: 56,
          padding: '12px 16px',
          fontSize: '1.15rem',
          fontWeight: 600,
          borderRadius: 10,
          whiteSpace: 'normal',
          wordBreak: 'break-word',
          transition: 'all 0.2s ease',
        };

        if (selectedOption !== null) {
          if (isCorrect) {
            customStyle = { ...customStyle, backgroundColor: '#52c41a', color: '#fff', borderColor: '#52c41a' };
          } else if (isSelected && !isCorrect) {
            customStyle = { ...customStyle, backgroundColor: '#ff4d4f', color: '#fff', borderColor: '#ff4d4f' };
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