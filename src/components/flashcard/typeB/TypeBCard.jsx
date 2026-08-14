// src/components/flashcard/typeB/TypeBCard.jsx
import React, { useState, useEffect } from 'react';
import { Card, Button, Typography, Flex } from 'antd';
import { Lightbulb, Volume2 } from 'lucide-react';
import { speakText } from '../../../utils/speechUtils';

const { Title, Text } = Typography;

const TypeBCard = ({ question }) => {
  const [showHint, setShowHint] = useState(false);

  // Ẩn hint mỗi khi chuyển câu hỏi
  useEffect(() => {
    setShowHint(false);
  }, [question?.id]);

  if (!question) return null;

  return (
    <Card
      style={{
        textAlign: 'center',
        marginBottom: 30,
        padding: '40px 20px',
        borderRadius: 16,
        boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
      }}
    >
      <Title level={2}>{question.displayQuestion}</Title>

      <Flex justify="center" gap="small" style={{ marginTop: 10 }}>
        <Button
          type="dashed"
          icon={<Volume2 size={16} />}
          onClick={() => speakText(question.displayQuestion, question.qLang || 'en-US')}
        >
          Read Aloud
        </Button>

        {question.hint && (
          <Button
            type="dashed"
            icon={<Lightbulb size={16} />}
            onClick={() => setShowHint(!showHint)}
          >
            Hint
          </Button>
        )}
      </Flex>

      {showHint && question.hint && (
        <div style={{ marginTop: 16, padding: '12px', background: '#fffbe6', border: '1px solid #ffe58f', borderRadius: 8 }}>
          <Text style={{ color: '#d48806', fontSize: '1rem' }}>💡 {question.hint}</Text>
        </div>
      )}
    </Card>
  );
};

export default TypeBCard;