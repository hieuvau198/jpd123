// src/components/flashcard/spellingbee/SpellingBeeHeader.jsx
import React from 'react';
import { Button, Typography, Flex, Space, Radio } from 'antd';
import { ArrowLeft, CheckSquare, Keyboard } from 'lucide-react';

const { Text } = Typography;

const SpellingBeeHeader = ({ 
  onBack, 
  currentIndex, 
  total, 
  inputMode, 
  setInputMode, 
  disabled 
}) => {
  return (
    <Flex vertical gap="middle" style={{ marginBottom: 20 }}>
      <Flex justify="space-between" align="center">
        <Button icon={<ArrowLeft size={16} />} onClick={onBack} />
        <Space>
          <Text strong>SPELLING BEE</Text>
          <Text type="secondary">|</Text>
          <Text strong>{currentIndex + 1} / {total}</Text>
        </Space>
      </Flex>

      {/* Switcher Mode: Trắc nghiệm vs Điền từ */}
      <Flex justify="center">
        <Radio.Group
          value={inputMode}
          onChange={(e) => setInputMode(e.target.value)}
          buttonStyle="solid"
          size="middle"
          disabled={disabled}
        >
          <Radio.Button value="mc" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <CheckSquare size={16} /> Trắc nghiệm
          </Radio.Button>
          <Radio.Button value="typing" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <Keyboard size={16} /> Điền từ
          </Radio.Button>
        </Radio.Group>
      </Flex>
    </Flex>
  );
};

export default SpellingBeeHeader;