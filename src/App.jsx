import React, { useState } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import './App.css'; 

// Components
import AdminDashboard from './components/AdminDashboard';
import Home from './pages/Home';
import FlashcardList from './pages/FlashcardList';
import FlashcardDetail from './pages/FlashcardDetail';
import QuizList from './pages/QuizList';
import QuizDetail from './pages/QuizDetail';

// --- DATA LOADING ---
// Load Quizzes globally (since they are local files)
const quizImports = import.meta.glob('./data/quiz/*.json', { eager: true, import: 'default' });
const QUIZ_DATA = Object.values(quizImports).map(d => ({ ...d, type: 'quiz' }));

export default function App() {
  const [showAdmin, setShowAdmin] = useState(false);
  const navigate = useNavigate();

  // If Admin is active, render it overlaying everything (or simpler: conditional return)
  if (showAdmin) {
    return <AdminDashboard onBack={() => setShowAdmin(false)} />;
  }

  return (
    <main>
      <Routes>
        {/* Home Page */}
        <Route 
            path="/" 
            element={<Home onGoAdmin={() => setShowAdmin(true)} />} 
        />
        
        {/* Flashcard Routes */}
        <Route path="/flashcards" element={<FlashcardList />} />
        <Route path="/flashcard/:id" element={<FlashcardDetail />} />

        {/* Quiz Routes */}
        <Route path="/quizzes" element={<QuizList quizData={QUIZ_DATA} />} />
        <Route path="/quiz/:id" element={<QuizDetail quizData={QUIZ_DATA} />} />
        
        {/* Fallback */}
        <Route path="*" element={<Home onGoAdmin={() => setShowAdmin(true)} />} />
      </Routes>
    </main>
  );
}