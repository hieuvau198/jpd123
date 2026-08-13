import React from 'react';
import { Modal, Button, Typography, Select, Switch } from 'antd';
import { Settings } from 'lucide-react';

const { Text } = Typography;

const MCVoiceSettings = ({
  showSettings, setShowSettings, voices,
  enVoiceURI, setEnVoiceURI, viVoiceURI, setViVoiceURI,
  autoSpeakQuestion, setAutoSpeakQuestion,
  autoSpeakAnswer, setAutoSpeakAnswer
}) => {
  return (
    <Modal
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Settings size={20} />
          <span>Voice & Audio Settings</span>
        </div>
      }
      open={showSettings}
      onOk={() => setShowSettings(false)}
      onCancel={() => setShowSettings(false)}
      footer={[
        <Button key="ok" type="primary" onClick={() => setShowSettings(false)}>Done</Button>
      ]}
    >
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <Text strong>Auto-Speak Question</Text>
          <Switch
            checked={autoSpeakQuestion}
            onChange={(checked) => { setAutoSpeakQuestion(checked); localStorage.setItem('autoSpeakQuestion', checked); }}
          />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text strong>Auto-Speak Correct Answer</Text>
          <Switch
            checked={autoSpeakAnswer}
            onChange={(checked) => { setAutoSpeakAnswer(checked); localStorage.setItem('autoSpeakAnswer', checked); }}
          />
        </div>
      </div>
      <div style={{ borderTop: '1px solid #f0f0f0', paddingTop: 16, marginBottom: 16 }}>
        <Text strong>English Voice:</Text>
        <Select
          value={enVoiceURI}
          onChange={val => { setEnVoiceURI(val); localStorage.setItem('enVoiceURI', val); }}
          style={{ width: '100%', marginTop: 8 }}
          showSearch
        >
          <Select.Option value="">-- Auto Detect (Default) --</Select.Option>
          {voices.map(v => (
            <Select.Option key={v.voiceURI} value={v.voiceURI}>{v.name} ({v.lang})</Select.Option>
          ))}
        </Select>
      </div>
      <div>
        <Text strong>Vietnamese Voice:</Text>
        <Select
          value={viVoiceURI}
          onChange={val => { setViVoiceURI(val); localStorage.setItem('viVoiceURI', val); }}
          style={{ width: '100%', marginTop: 8 }}
          showSearch
        >
          <Select.Option value="">-- Auto Detect (Default) --</Select.Option>
          {voices.map(v => (
            <Select.Option key={v.voiceURI} value={v.voiceURI}>{v.name} ({v.lang})</Select.Option>
          ))}
        </Select>
      </div>
    </Modal>
  );
};

export default MCVoiceSettings;