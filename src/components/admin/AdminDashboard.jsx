// src/components/admin/AdminDashboard.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Typography, Card, Button, Tabs, Divider } from 'antd'; 
import { Home, FileJson, FileQuestion, Wrench, Mic, Shield, Volume2, Users, FlaskConical, Beaker, HelpCircle, FileText } from 'lucide-react';

import GenericManager from './GenericManager';
import FlashcardManager from './FlashcardManager';
import DefenseManager from './DefenseManager';
import PhoneticManager from './PhoneticManager'; 
import ChemistryManager from './ChemistryManager';
import ChemReactionManager from './ChemReactionManager';

import { getAllChemistry, getChemistryByTag, saveChemistrySet, deleteChemistrySet } from '../../firebase/chemistryService';
import { getAllQuizzes, getQuizzesByTag, saveQuizSet, deleteQuizSet } from '../../firebase/quizService';
import { getAllRepairs, saveRepairSet, deleteRepairSet } from '../../firebase/repairService';
import { getAllSpeaks, saveSpeakSet, deleteSpeakSet } from '../../firebase/speakService';
import { getAllChemReactions, getChemReactionsByTag, saveChemReactionSet, deleteChemReactionSet } from '../../firebase/chemReactionService';
import { getAllDocuments, getDocumentsByTag, saveDocumentSet, deleteDocumentSet } from '../../firebase/documentService';

// --- NEW IMPORT FOR OTHER QUIZZES ---
import { getAllOtherQuizzes, getOtherQuizzesByTag, saveOtherQuizSet, deleteOtherQuizSet } from '../../firebase/otherQuizService';

const { Title } = Typography;

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('flashcard');

  const tabItems = [
    { key: 'flashcard', label: 'Flashcards', children: <FlashcardManager icon={<FileJson color="#faad14" size={24} />} color="blue" uploadText="Import Flashcards (JSON)" uploadColor="#1890ff" /> },
    { key: 'quiz', label: 'Quizzes', children: <GenericManager type="quiz" icon={<FileQuestion color="#52c41a" size={24} />} color="green" uploadText="Import Quizzes (JSON)" uploadColor="#52c41a" fetchFn={getAllQuizzes} fetchByTagFn={getQuizzesByTag} saveFn={saveQuizSet} deleteFn={deleteQuizSet} /> },
    { key: 'phonetic', label: 'Phonetic', children: <PhoneticManager icon={<Volume2 color="#fa541c" size={24} />} color="volcano" uploadText="Import Phonetics (JSON)" uploadColor="#fa541c" /> },
    { key: 'repair', label: 'Repair', children: <GenericManager type="repair" icon={<Wrench color="#722ed1" size={24} />} color="purple" uploadText="Import Repair Sets (JSON)" uploadColor="#722ed1" fetchFn={getAllRepairs} saveFn={saveRepairSet} deleteFn={deleteRepairSet} /> },
    { key: 'speak', label: 'Speak', children: <GenericManager type="speak" icon={<Mic color="#eb2f96" size={24} />} color="magenta" uploadText="Import Speak Sets (JSON)" uploadColor="#eb2f96" fetchFn={getAllSpeaks} saveFn={saveSpeakSet} deleteFn={deleteSpeakSet} /> },
    { key: 'defense', label: 'Defense Config', children: <DefenseManager icon={<Shield color="#f5222d" size={24} />} color="red" uploadText="Import Defense Config (JSON)" uploadColor="#f5222d" /> },
  ];

  return (
    <div style={{ maxWidth: 1000, margin: '40px auto', padding: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 30 }}>
        
        <div style={{ display: 'flex', gap: '10px' }}>
          <Button type="primary" icon={<Users size={16} />} onClick={() => navigate('/admin/users')}></Button>
          <Button icon={<Home size={16} />} onClick={() => navigate('/')} className='ml-4'></Button>
        </div>
      </div>

      {/* English Card */}
      <Card style={{ marginBottom: 40 }}>
        <Tabs activeKey={activeTab} onChange={setActiveTab} items={tabItems} type="card" />
      </Card>

      {/* Chemistry Section Card */}
      <Divider />
      <Card style={{ marginBottom: 20 }}>
        <Tabs
          defaultActiveKey="1"
          items={[
            {
              key: '1',
              label: 'Chemistry Quizzes',
              children: (
                <ChemistryManager 
                  icon={<FlaskConical color="#722ed1" />}
                  color="#f9f0ff"
                  uploadText="Upload Chem Quiz JSON"
                  uploadColor="#722ed1"
                  fetchFn={getAllChemistry}
                  fetchByTagFn={getChemistryByTag}
                  saveFn={saveChemistrySet}
                  deleteFn={deleteChemistrySet}
                />
              ),
            },
            {
              key: '2',
              label: 'Chemical Reactions',
              children: (
                <ChemReactionManager 
                  icon={<Beaker color="#eb2f96" />}
                  color="#fff0f6"
                  uploadText="Upload Chem Reaction JSON"
                  uploadColor="#eb2f96"
                  fetchFn={getAllChemReactions}
                  fetchByTagFn={getChemReactionsByTag}
                  saveFn={saveChemReactionSet}
                  deleteFn={deleteChemReactionSet}
                />
              ),
            },
          ]}
        />
      </Card>

      <Divider />
      <Card style={{ marginBottom: 20 }} >
        <GenericManager 
          type="document" 
          icon={<FileText color="#1890ff" size={24} />}
          color="blue"
          uploadText="Upload Document JSON"
          uploadColor="#1890ff"
          fetchFn={getAllDocuments}
          fetchByTagFn={getDocumentsByTag}
          saveFn={saveDocumentSet}
          deleteFn={deleteDocumentSet}
        />
      </Card>

      {/* NEW OTHER QUIZZES SECTION */}
      <Divider />
      <Card style={{ marginBottom: 20 }} >
        <GenericManager 
          type="quiz" // Notice: Kept as "quiz" so the Preview Modal continues to work smoothly 
          icon={<HelpCircle color="#fa8c16" size={24} />}
          color="orange"
          uploadText="Upload Other Quiz JSON"
          uploadColor="#fa8c16"
          fetchFn={getAllOtherQuizzes}
          fetchByTagFn={getOtherQuizzesByTag}
          saveFn={saveOtherQuizSet}
          deleteFn={deleteOtherQuizSet}
        />
      </Card>
    </div>
  );
};
export default AdminDashboard;