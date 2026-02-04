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
// Import New Repair Components
import RepairList from './pages/RepairList';
import RepairDetail from './pages/RepairDetail';

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

        {/* Repair Routes (New) */}
        <Route path="/repairs" element={<RepairList />} />
        <Route path="/repair/:id" element={<RepairDetail />} />
        
        {/* Fallback */}
        <Route path="*" element={<Home />} />
      </Routes>
    </main>
  );
}