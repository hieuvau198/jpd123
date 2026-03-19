// src/App.jsx
import React from 'react';
import { Routes, Route } from 'react-router-dom';
import './App.css'; 

// Import the new NavBar
import NavBar from './components/layout/NavBar';

// Components
import AdminDashboard from './components/admin/AdminDashboard';
import Home from './pages/Home';
import Login from './pages/Login'; 
import Profile from './pages/Profile'; 
import FlashcardList from './pages/FlashcardList';
import FlashcardDetail from './pages/FlashcardDetail';
import QuizList from './pages/QuizList';
import QuizDetail from './pages/QuizDetail';
import RepairList from './pages/RepairList';
import RepairDetail from './pages/RepairDetail';
import SpeakList from './pages/SpeakList';
import SpeakDetail from './pages/SpeakDetail';
import PhoneticList from './pages/PhoneticList';
import PhoneticDetail from './pages/PhoneticDetail';
import ChemQuizList from './pages/ChemQuizList';
import ChemQuizDetail from './pages/ChemQuizDetail';

// --- NEW CHEM REACTION IMPORTS ---
import ChemReactionList from './pages/ChemReactionList';
import ChemReactionDetail from './pages/ChemReactionDetail';
import OtherQuizList from './pages/OtherQuizList';

import DefenseList from './pages/DefenseList';
import DefenseDetail from './pages/DefenseDetail';
import UserManager from './components/admin/UserManager/UserManager';

export default function App() {
  return (
    <main>
      <NavBar />
      
      <Routes>
        <Route path="/" element={<Home />} />

        <Route path="/login" element={<Login />} />
        <Route path="/profile" element={<Profile />} />
        
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/admin/users" element={<UserManager />} /> 
        
        <Route path="/flashcards" element={<FlashcardList />} />
        <Route path="/flashcard/:id" element={<FlashcardDetail />} />

        <Route path="/quizzes" element={<QuizList />} />
        <Route path="/quiz/:id" element={<QuizDetail />} />

        <Route path="/repairs" element={<RepairList />} />
        <Route path="/repair/:id" element={<RepairDetail />} />

        <Route path="/speaks" element={<SpeakList />} />
        <Route path="/speak/:id" element={<SpeakDetail />} />

        <Route path="/phonetic" element={<PhoneticList />} />
        <Route path="/phonetic/:id" element={<PhoneticDetail />} />

        <Route path="/challenge" element={<DefenseList />} />
        <Route path="/challenge/:id" element={<DefenseDetail />} />

        <Route path="/chem-quiz" element={<ChemQuizList />} />
        <Route path="/chem-quiz/:id" element={<ChemQuizDetail />} />

          
        <Route path="/chem-reaction" element={<ChemReactionList />} />
        <Route path="/chem-reaction/:id" element={<ChemReactionDetail />} />
        <Route path="/other-quizzes" element={<OtherQuizList />} />

        <Route path="*" element={<Home />} />
      </Routes>
    </main>
  );
}