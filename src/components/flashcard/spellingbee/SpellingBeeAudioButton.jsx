// src/components/flashcard/spellingbee/SpellingBeeAudioButton.jsx
import React from 'react';
import { Button, Flex, Badge, Typography } from 'antd';
import { Volume2 } from 'lucide-react';

const { Text } = Typography;

const SpellingBeeAudioButton = ({ listenCount, onPlay, disabled, maxListens = 4 }) => {
  const remaining = Math.max(0, maxListens - listenCount);

  return (
    <Flex vertical align="center" style={{ marginBottom: 24 }}>
      <Badge 
        count={remaining} 
        showZero 
        color={remaining === 0 ? '#ff4d4f' : '#1890ff'} 
        offset={[-5, 5]}
      >
        <Button
          type="primary"
          shape="circle"
          size="large"
          icon={<Volume2 size={32} />}
          onClick={onPlay}
          disabled={remaining <= 0 || disabled}
          style={{ width: 80, height: 80 }}
        />
      </Badge>
      <Text type="secondary" style={{ marginTop: 12, fontSize: 13 }}>
        {remaining === 0 ? "Hết lượt nghe lại" : `Nghe từ và chọn/nhập đáp án (${remaining} lượt nghe còn lại)`}
      </Text>
    </Flex>
  );
};

export default SpellingBeeAudioButton;