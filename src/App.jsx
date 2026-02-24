import React from 'react';
import { Routes, Route } from 'react-router-dom';
import './App.css'; 

// Components
import AdminDashboard from './components/AdminDashboard';
import Home from './pages/Home';
import FlashcardList from './pages/FlashcardList';
import FlashcardDetail from './pages/FlashcardDetail';
import QuizList from './pages/QuizList';
import QuizDetail from './pages/QuizDetail';
import RepairList from './pages/RepairList';
import RepairDetail from './pages/RepairDetail';
import SpeakList from './pages/SpeakList';
import SpeakDetail from './pages/SpeakDetail';
// Import Defense (New)
import DefenseList from './pages/DefenseList';
import DefenseDetail from './pages/DefenseDetail';

export default function App() {
  return (
    <main>
      <Routes>
        {/* Home Page */}
        <Route path="/" element={<Home />} />
        
        {/* Admin Route */}
        <Route path="/admin" element={<AdminDashboard />} />
        
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

        {/* Defense Routes (New) */}
        <Route path="/defense" element={<DefenseList />} />
        <Route path="/defense/:id" element={<DefenseDetail />} />
        
        {/* Fallback */}
        <Route path="*" element={<Home />} />
      </Routes>
    </main>
  );
}