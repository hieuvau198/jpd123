// src/components/flashcard/spellingbee/SpellingBeeHeader.jsx
import React from 'react';
import { Button, Typography, Flex, Space } from 'antd';
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

      {/* Switcher Mode: Custom Pill Toggle */}
      <Flex justify="center">
        <div style={{
          display: 'inline-flex',
          background: '#f0f0f0',
          padding: '4px',
          borderRadius: '12px',
          border: '1px solid #e8e8e8'
        }}>
          <div
            onClick={() => !disabled && setInputMode('mc')}
            style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              padding: '8px 24px',
              borderRadius: '8px',
              cursor: disabled ? 'not-allowed' : 'pointer',
              background: inputMode === 'mc' ? '#1890ff' : 'transparent',
              color: inputMode === 'mc' ? '#fff' : '#595959',
              fontWeight: inputMode === 'mc' ? 600 : 500,
              transition: 'all 0.2s ease',
              boxShadow: inputMode === 'mc' ? '0 2px 6px rgba(24,144,255,0.3)' : 'none'
            }}
          >
            <CheckSquare size={18} /> Trắc nghiệm
          </div>
          <div
            onClick={() => !disabled && setInputMode('typing')}
            style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              padding: '8px 24px',
              borderRadius: '8px',
              cursor: disabled ? 'not-allowed' : 'pointer',
              background: inputMode === 'typing' ? '#1890ff' : 'transparent',
              color: inputMode === 'typing' ? '#fff' : '#595959',
              fontWeight: inputMode === 'typing' ? 600 : 500,
              transition: 'all 0.2s ease',
              boxShadow: inputMode === 'typing' ? '0 2px 6px rgba(24,144,255,0.3)' : 'none'
            }}
          >
            <Keyboard size={18} /> Điền từ
          </div>
        </div>
      </Flex>
    </Flex>
  );
};

export default SpellingBeeHeader;