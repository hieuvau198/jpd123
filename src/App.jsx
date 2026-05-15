// src/App.jsx
import React from 'react';
import { Routes, Route } from 'react-router-dom';
import './App.css'; 

// Import the new NavBar
import NavBar from './components/layout/NavBar';
import ProtectedRoute from './components/layout/ProtectedRoute';

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
import OtherQuizDetail from './pages/OtherQuizDetail';

import DefenseList from './pages/DefenseList';
import DefenseDetail from './pages/DefenseDetail';
import UserManager from './components/admin/UserManager/UserManager';
import GroupManager from './components/admin/GroupManager/GroupManager';
import UserHistoryPage from './components/admin/UserHistory/UserHistoryPage';

import DocumentList from './pages/DocumentList';
import DocumentDetail from './pages/DocumentDetail';

export default function App() {
  return (
    <main>
      <NavBar />
      
      <Routes>
        {/* PUBLIC ROUTE
          The login page MUST be public so unauthenticated users have a place to go. 
        */}
        <Route path="/login" element={<Login />} />
        
        {/* PROTECTED ROUTES */}
        <Route path="/" element={<ProtectedRoute><Home /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
        
        {/* Admin */}
        <Route path="/admin" element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} />
        <Route path="/admin/users" element={<ProtectedRoute><UserManager /></ProtectedRoute>} /> 
        <Route path="/admin/groups" element={<ProtectedRoute><GroupManager /></ProtectedRoute>} />
        <Route path="/admin/user-history" element={<ProtectedRoute><UserHistoryPage /></ProtectedRoute>} />
        
        {/* Flashcards */}
        <Route path="/flashcards" element={<ProtectedRoute><FlashcardList /></ProtectedRoute>} />
        <Route path="/flashcard/:id" element={<ProtectedRoute><FlashcardDetail /></ProtectedRoute>} />

        {/* Quizzes */}
        <Route path="/quizzes" element={<ProtectedRoute><QuizList /></ProtectedRoute>} />
        <Route path="/quiz/:id" element={<ProtectedRoute><QuizDetail /></ProtectedRoute>} />

        {/* Repairs */}
        <Route path="/repairs" element={<ProtectedRoute><RepairList /></ProtectedRoute>} />
        <Route path="/repair/:id" element={<ProtectedRoute><RepairDetail /></ProtectedRoute>} />

        {/* Speaking */}
        <Route path="/speaks" element={<ProtectedRoute><SpeakList /></ProtectedRoute>} />
        <Route path="/speak/:id" element={<ProtectedRoute><SpeakDetail /></ProtectedRoute>} />

        {/* Phonetics */}
        <Route path="/phonetic" element={<ProtectedRoute><PhoneticList /></ProtectedRoute>} />
        <Route path="/phonetic/:id" element={<ProtectedRoute><PhoneticDetail /></ProtectedRoute>} />

        {/* Challenges/Defense */}
        <Route path="/challenge" element={<ProtectedRoute><DefenseList /></ProtectedRoute>} />
        <Route path="/challenge/:id" element={<ProtectedRoute><DefenseDetail /></ProtectedRoute>} />

        {/* Chemistry */}
        <Route path="/chem-quiz" element={<ProtectedRoute><ChemQuizList /></ProtectedRoute>} />
        <Route path="/chem-quiz/:id" element={<ProtectedRoute><ChemQuizDetail /></ProtectedRoute>} />
        <Route path="/chem-reaction" element={<ProtectedRoute><ChemReactionList /></ProtectedRoute>} />
        <Route path="/chem-reaction/:id" element={<ProtectedRoute><ChemReactionDetail /></ProtectedRoute>} />

        <Route path="/documents" element={<DocumentList />} />
        <Route path="/documents/:id" element={<DocumentDetail />} />
        
        {/* Other Quizzes */}
        <Route path="/other-quizzes" element={<ProtectedRoute><OtherQuizList /></ProtectedRoute>} />
        <Route path="/other-quiz/:id" element={<ProtectedRoute><OtherQuizDetail /></ProtectedRoute>} />

        {/* Catch-all 404 route - also protected */}
        <Route path="*" element={<ProtectedRoute><Home /></ProtectedRoute>} />
      </Routes>
    </main>
  );
}