import React from 'react';
import { Routes, Route } from 'react-router-dom';
import './App.css'; 

// Components
import AdminDashboard from './components/admin/AdminDashboard';
import Home from './pages/Home';
import Login from './pages/Login'; // <-- Added Login
import Profile from './pages/Profile'; // <-- Added Profile
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

import DefenseList from './pages/DefenseList';
import DefenseDetail from './pages/DefenseDetail';
import UserManager from './components/admin/UserManager/UserManager';

export default function App() {
  return (
    <main>
      <Routes>
        {/* Home Page */}
        <Route path="/" element={<Home />} />

        {/* Auth & Profile Routes (New) */}
        <Route path="/login" element={<Login />} />
        <Route path="/profile" element={<Profile />} />
        
        {/* Admin Route */}
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/admin/users" element={<UserManager />} /> 
        
        {/* Flashcard Routes */}
        <Route path="/flashcards" element={<FlashcardList />} />
        <Route path="/flashcard/:id" element={<FlashcardDetail />} />

        {/* Quiz Routes */}
        <Route path="/quizzes" element={<QuizList />} />
        <Route path="/quiz/:id" element={<QuizDetail />} />

        {/* Repair Routes */}
        <Route path="/repairs" element={<RepairList />} />
        <Route path="/repair/:id" element={<RepairDetail />} />

        {/* Speak Routes */}
        <Route path="/speaks" element={<SpeakList />} />
        <Route path="/speak/:id" element={<SpeakDetail />} />

        <Route path="/phonetic" element={<PhoneticList />} />
        <Route path="/phonetic/:id" element={<PhoneticDetail />} />

        {/* Defense Routes */}
        <Route path="/challenge" element={<DefenseList />} />
        <Route path="/challenge/:id" element={<DefenseDetail />} />
        
        {/* Fallback */}
        <Route path="*" element={<Home />} />
      </Routes>
    </main>
  );
}