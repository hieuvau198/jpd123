// src/components/flashcard/mc/MCVoiceSettings.jsx
import React from 'react';
import { Modal, Button, Typography, Switch } from 'antd';
import { Settings } from 'lucide-react';

const { Text } = Typography;

const MCVoiceSettings = ({
  showSettings,
  setShowSettings,
  autoSpeakQuestion,
  setAutoSpeakQuestion,
  autoSpeakAnswer,
  setAutoSpeakAnswer
}) => {
  return (
    <Modal
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Settings size={20} />
          <span>Audio Settings</span>
        </div>
      }
      open={showSettings}
      onOk={() => setShowSettings(false)}
      onCancel={() => setShowSettings(false)}
      footer={[
        <Button key="ok" type="primary" onClick={() => setShowSettings(false)}>
          Done
        </Button>
      ]}
    >
      <div style={{ marginBottom: 16, display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text strong>Auto-Speak Question</Text>
          <Switch
            checked={autoSpeakQuestion}
            onChange={(checked) => {
              setAutoSpeakQuestion(checked);
              localStorage.setItem('autoSpeakQuestion', checked);
            }}
          />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text strong>Auto-Speak Correct Answer</Text>
          <Switch
            checked={autoSpeakAnswer}
            onChange={(checked) => {
              setAutoSpeakAnswer(checked);
              localStorage.setItem('autoSpeakAnswer', checked);
            }}
          />
        </div>
      </div>
    </Modal>
  );
};

export default MCVoiceSettings;