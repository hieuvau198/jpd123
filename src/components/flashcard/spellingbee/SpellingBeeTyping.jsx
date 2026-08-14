// src/components/flashcard/spellingbee/SpellingBeeTyping.jsx
import React from 'react';
import { Button } from 'antd';

const SpellingBeeTyping = ({ 
  inputRef, 
  inputValue, 
  setInputValue, 
  onSubmit, 
  feedback, 
  disabled 
}) => {
  return (
    <form onSubmit={onSubmit} style={{ marginBottom: 10 }}>
      <input
        ref={inputRef}
        type="text"
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        placeholder="Nhập từ bạn nghe được..."
        disabled={disabled}
        autoComplete="off"
        spellCheck="false"
        style={{
          width: '100%',
          maxWidth: 400,
          padding: '12px 15px',
          fontSize: 20,
          textAlign: 'center',
          borderRadius: 8,
          outline: 'none',
          border: feedback === 'correct' ? '2px solid #52c41a' :
                  feedback === 'wrong' ? '2px solid #ff4d4f' : '1px solid #d9d9d9',
          backgroundColor: feedback === 'neutral' ? '#fff' : '#f5f5f5',
          margin: '0 auto',
          display: 'block',
        }}
      />
      {feedback === 'neutral' && (
        <div style={{ marginTop: 20 }}>
          <Button type="primary" htmlType="submit" size="large" style={{ minWidth: 120 }}>
            Kiểm tra
          </Button>
        </div>
      )}
    </form>
  );
};

export default SpellingBeeTyping;