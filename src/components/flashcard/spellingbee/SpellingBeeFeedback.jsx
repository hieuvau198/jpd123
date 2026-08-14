// src/components/flashcard/spellingbee/SpellingBeeFeedback.jsx
import React from 'react';
import { Button, Typography } from 'antd';
import { ArrowRight, CheckCircle, XCircle } from 'lucide-react';

const { Title, Text } = Typography;

const SpellingBeeFeedback = ({ feedback, currentCard, onNext }) => {
  if (feedback === 'neutral') return null;

  const isCorrect = feedback === 'correct';

  return (
    <div
      style={{
        marginTop: 24,
        padding: 20,
        borderRadius: 12,
        backgroundColor: isCorrect ? '#f6ffed' : '#fff1f0',
        border: isCorrect ? '1px solid #b7eb8f' : '1px solid #ffa39e',
      }}
    >
      <Title
        level={4}
        style={{
          color: isCorrect ? '#52c41a' : '#ff4d4f',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          marginTop: 0,
        }}
      >
        {isCorrect ? <CheckCircle /> : <XCircle />}
        {isCorrect ? 'Chính xác!' : 'Chưa đúng!'}
      </Title>

      <div style={{ margin: '12px 0' }}>
        <Text type="secondary">Từ vựng:</Text>
        <br />
        <Text strong style={{ fontSize: 22 }}>
          {currentCard.question}
        </Text>
      </div>

      <div style={{ margin: '12px 0' }}>
        <Text type="secondary">Nghĩa của từ:</Text>
        <br />
        <Text strong style={{ fontSize: 18 }}>
          {currentCard.answer}
        </Text>
      </div>

      <Button
        type="primary"
        danger={!isCorrect}
        size="large"
        onClick={onNext}
        style={{ marginTop: 10, minWidth: 150 }}
        autoFocus
      >
        Câu tiếp theo <ArrowRight size={16} style={{ marginLeft: 8 }} />
      </Button>
    </div>
  );
};

export default SpellingBeeFeedback;