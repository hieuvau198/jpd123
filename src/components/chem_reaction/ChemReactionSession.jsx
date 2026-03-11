// src/components/chem_reaction/ChemReactionSession.jsx
import React, { useState } from 'react';
import { Card, Typography, Button } from 'antd';
import { ArrowLeft, BookOpen, HelpCircle, GitMerge, ListChecks } from 'lucide-react';

import DefinitionSession from './modes/DefinitionSession';
import MissingSession from './modes/MissingSession';
import MatchingSession from './modes/MatchingSession';
import MCSession from './modes/MCSession';

const { Title, Text } = Typography;

const ChemReactionSession = ({ data, onHome }) => {
  const [currentMode, setCurrentMode] = useState(null);

  const renderMode = () => {
    switch (currentMode) {
      case 'definition':
        return <DefinitionSession data={data} onBack={() => setCurrentMode(null)} />;
      case 'missing':
        return <MissingSession data={data} onBack={() => setCurrentMode(null)} />;
      case 'matching':
        return <MatchingSession data={data} onBack={() => setCurrentMode(null)} />;
      case 'mc':
        return <MCSession data={data} onBack={() => setCurrentMode(null)} />;
      default:
        return null;
    }
  };

  if (currentMode) {
    return renderMode();
  }

  return (
    <div className="min-h-screen p-4 sm:p-8 max-w-5xl mx-auto">
      <div className="mb-8 flex items-center gap-4">
        <Button 
          icon={<ArrowLeft size={16} />} 
          onClick={onHome}
          className="flex items-center"
        >
          Back
        </Button>
        <Title level={2} style={{ margin: 0, color: 'white' }}>
          {data?.title || 'Chemistry Reaction Practice'}
        </Title>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mt-8">
        {/* Definition Mode */}
        <Card 
          hoverable 
          onClick={() => setCurrentMode('definition')}
          style={{ borderRadius: 12, textAlign: 'center', borderColor: '#1890ff', backgroundColor: 'rgba(255,255,255,0.05)' }}
        >
          <BookOpen size={48} color="#1890ff" className="mx-auto mb-4" />
          <Title level={4} style={{ color: '#1890ff' }}>Definition</Title>
          <Text type="secondary" style={{color: '#ccc'}}>Review the chemical reactions and formulas.</Text>
        </Card>

        {/* Missing Mode */}
        <Card 
          hoverable 
          onClick={() => setCurrentMode('missing')}
          style={{ borderRadius: 12, textAlign: 'center', borderColor: '#52c41a', backgroundColor: 'rgba(255,255,255,0.05)' }}
        >
          <HelpCircle size={48} color="#52c41a" className="mx-auto mb-4" />
          <Title level={4} style={{ color: '#52c41a' }}>Missing</Title>
          <Text type="secondary" style={{color: '#ccc'}}>Fill in the missing reactants or products.</Text>
        </Card>

        {/* Matching Mode */}
        <Card 
          hoverable 
          onClick={() => setCurrentMode('matching')}
          style={{ borderRadius: 12, textAlign: 'center', borderColor: '#722ed1', backgroundColor: 'rgba(255,255,255,0.05)' }}
        >
          <GitMerge size={48} color="#722ed1" className="mx-auto mb-4" />
          <Title level={4} style={{ color: '#722ed1' }}>Matching</Title>
          <Text type="secondary" style={{color: '#ccc'}}>Match reactants to their corresponding products.</Text>
        </Card>

        {/* MC Mode */}
        <Card 
          hoverable 
          onClick={() => setCurrentMode('mc')}
          style={{ borderRadius: 12, textAlign: 'center', borderColor: '#eb2f96', backgroundColor: 'rgba(255,255,255,0.05)' }}
        >
          <ListChecks size={48} color="#eb2f96" className="mx-auto mb-4" />
          <Title level={4} style={{ color: '#eb2f96' }}>Multiple Choice</Title>
          <Text type="secondary" style={{color: '#ccc'}}>Test your knowledge with multiple choice questions.</Text>
        </Card>
      </div>
    </div>
  );
};

export default ChemReactionSession;