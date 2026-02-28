// src/components/admin/AdminDashboard.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Typography, Card, Button, Tabs } from 'antd';
// Add Volume2 for phonetics
import { Home, FileJson, FileQuestion, Wrench, Mic, Shield, Volume2 } from 'lucide-react';

// Admin Components
import AdminLogin from './AdminLogin';
import GenericManager from './GenericManager';
import FlashcardManager from './FlashcardManager';
import DefenseManager from './DefenseManager';
import PhoneticManager from './PhoneticManager'; // <-- Import the new manager

// Firebase Services
import { getAllQuizzes, getQuizzesByTag, saveQuizSet, deleteQuizSet } from '../../firebase/quizService';
import { getAllRepairs, saveRepairSet, deleteRepairSet } from '../../firebase/repairService';
import { getAllSpeaks, saveSpeakSet, deleteSpeakSet } from '../../firebase/speakService';

const { Title } = Typography;

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [activeTab, setActiveTab] = useState('flashcard');

  if (!isAuthenticated) {
    return <AdminLogin onLoginSuccess={() => setIsAuthenticated(true)} />;
  }

  const tabItems = [
    {
      key: 'flashcard',
      label: 'Flashcards',
      children: (
        <FlashcardManager 
          icon={<FileJson color="#faad14" size={24} />} 
          color="blue" 
          uploadText="Import Flashcards (JSON)" 
          uploadColor="#1890ff" 
        />
      )
    },
    {
      key: 'quiz',
      label: 'Quizzes',
      children: (
        <GenericManager 
          type="quiz" 
          icon={<FileQuestion color="#52c41a" size={24} />} 
          color="green" 
          uploadText="Import Quizzes (JSON)" 
          uploadColor="#52c41a"
          fetchFn={getAllQuizzes} 
          fetchByTagFn={getQuizzesByTag}
          saveFn={saveQuizSet} 
          deleteFn={deleteQuizSet}
        />
      )
    },
    // --> NEW PHONETIC TAB <--
    {
      key: 'phonetic',
      label: 'Phonetic',
      children: (
        <PhoneticManager 
          icon={<Volume2 color="#fa541c" size={24} />} 
          color="volcano" 
          uploadText="Import Phonetics (JSON)" 
          uploadColor="#fa541c" 
        />
      )
    },
    {
      key: 'repair',
      label: 'Repair',
      children: (
        <GenericManager 
          type="repair" 
          icon={<Wrench color="#722ed1" size={24} />} 
          color="purple" 
          uploadText="Import Repair Sets (JSON)" 
          uploadColor="#722ed1"
          fetchFn={getAllRepairs} saveFn={saveRepairSet} deleteFn={deleteRepairSet}
        />
      )
    },
    {
      key: 'speak',
      label: 'Speak',
      children: (
        <GenericManager 
          type="speak" 
          icon={<Mic color="#eb2f96" size={24} />} 
          color="magenta" 
          uploadText="Import Speak Sets (JSON)" 
          uploadColor="#eb2f96"
          fetchFn={getAllSpeaks} saveFn={saveSpeakSet} deleteFn={deleteSpeakSet}
        />
      )
    },
    {
      key: 'defense',
      label: 'Defense Config',
      children: (
        <DefenseManager 
          icon={<Shield color="#f5222d" size={24} />} 
          color="red" 
          uploadText="Import Defense Config (JSON)" 
          uploadColor="#f5222d" 
        />
      )
    }
  ];

  return (
    <div style={{ maxWidth: 1000, margin: '40px auto', padding: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 30 }}>
        <Title level={2} style={{ margin: 0 }}>Content Management</Title>
        <Button icon={<Home size={16} />} onClick={() => navigate('/')}>Back to Home</Button>
      </div>

      <Card>
        <Tabs activeKey={activeTab} onChange={setActiveTab} items={tabItems} type="card" />
      </Card>
    </div>
  );
};

export default AdminDashboard;