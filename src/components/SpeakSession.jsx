import React from 'react';
import { Button, Typography } from 'antd';
import ListenSession from './ListenSession';
import DefinitionSession from './DefinitionSession';

const SpeakSession = ({ data, mode = 'listen', onHome }) => {
  if (mode === 'listen') {
    return <ListenSession data={data} onHome={onHome} />;
  }
  
  // Handles both 'definition' and legacy 'stress' to be safe
  if (mode === 'definition' || mode === 'stress') {
    return <DefinitionSession data={data} onHome={onHome} />;
  }

  return (
    <div style={{ padding: 40, textAlign: 'center' }}>
      <Typography.Title level={3}>Unknown Mode Selected</Typography.Title>
      <Button onClick={onHome}>Go Back</Button>
    </div>
  );
};

export default SpeakSession;