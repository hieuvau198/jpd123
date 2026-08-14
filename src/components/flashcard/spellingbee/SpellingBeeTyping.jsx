// src/components/flashcard/spellingbee/SpellingBeeTyping.jsx
import React from 'react';
import { Button, Input, Flex } from 'antd';
import { SendOutlined } from '@ant-design/icons';

const SpellingBeeTyping = ({
  inputRef,
  inputValue,
  setInputValue,
  onSubmit,
  feedback,
  disabled
}) => {
  let statusBorder = '#d9d9d9';
  let statusBg = '#ffffff';

  if (feedback === 'correct') {
    statusBorder = '#52c41a';
    statusBg = '#f6ffed';
  } else if (feedback === 'wrong') {
    statusBorder = '#ff4d4f';
    statusBg = '#fff1f0';
  }

  return (
    <form onSubmit={onSubmit} style={{ maxWidth: 440, margin: '0 auto' }}>
      <Flex gap="small">
        <Input
          ref={inputRef}
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="Nhập từ bạn nghe được..."
          disabled={disabled}
          autoComplete="off"
          spellCheck="false"
          size="large"
          style={{
            fontSize: '1.2rem',
            textAlign: 'center',
            borderRadius: 12,
            height: 52,
            borderColor: statusBorder,
            backgroundColor: statusBg,
            fontWeight: 600,
            borderWidth: '2px',
          }}
        />
        {feedback === 'neutral' && (
          <Button
            type="primary"
            htmlType="submit"
            size="large"
            icon={<SendOutlined />}
            style={{
              height: 52,
              padding: '0 24px',
              borderRadius: 12,
              backgroundColor: '#1890ff',
              fontWeight: 600
            }}
          >
            Gửi
          </Button>
        )}
      </Flex>
    </form>
  );
};

export default SpellingBeeTyping;