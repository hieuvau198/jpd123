// src/components/flashcard/typeB/TypeBHeader.jsx
import React from 'react';
import { Button, Typography, Flex, Progress } from 'antd';
import { ArrowLeft, Settings } from 'lucide-react';

const { Text } = Typography;

const TypeBHeader = ({
  onBack,
  phase,
  currentIndex,
  totalQuestions,
  currentScore,
  onOpenSettings
}) => {
  const progressPercent = Math.round((currentIndex / totalQuestions) * 100);

  return (
    <Flex justify="space-between" align="center" style={{ marginBottom: 20, marginTop: 40 }}>
      <Button
        icon={<ArrowLeft size={20} />}
        onClick={() => {
          if ('speechSynthesis' in window) window.speechSynthesis.cancel();
          onBack();
        }}
      />

      <div style={{ flex: 1, maxWidth: 300, margin: '0 20px' }}>
        <Flex vertical align="center">
          <Text strong>{phase} Phase</Text>
          <Text type="secondary" style={{ fontSize: '12px' }}>
            {currentIndex + 1} / {totalQuestions}
          </Text>
          <Progress percent={progressPercent} showInfo={false} size="small" status="active" />
        </Flex>
      </div>

      <Flex gap="small" align="center">
        <Button type="text" disabled style={{ fontWeight: 'bold' }}>
          {currentScore}%
        </Button>
        <Button
          icon={<Settings size={18} />}
          onClick={onOpenSettings}
          title="Voice Settings"
        />
      </Flex>
    </Flex>
  );
};

export default TypeBHeader;