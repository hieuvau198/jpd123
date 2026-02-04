import React, { useState, useMemo, useEffect } from 'react';
import { Layers, ChevronRight, CheckSquare, Square, Play, BookOpen, Brain, Filter, Tag, Settings } from 'lucide-react';
import './App.css'; 
import QuizSession from './components/QuizSession';
import FlashcardSession from './components/FlashcardSession';
import AdminDashboard from './components/AdminDashboard'; // Import new component
import { getAllFlashcards } from './firebase/flashcardService'; // Import service

// --- SYSTEM DATA IMPORTS ---
import SUBJECTS_DATA from './data/system/subjects.json';
import TAGS_DATA from './data/system/tags.json';

// --- DATA LOADING ---
// 1. Keep Quizzes Local for now (as requested)
const quizImports = import.meta.glob('./data/quiz/*.json', { eager: true, import: 'default' });
const QUIZ_DATA = Object.values(quizImports).map(d => ({ ...d, type: 'quiz' }));

// 2. Remove local flashcard import. We will use State instead.
// const flashcardImports = import.meta.glob('./data/flashcard/*.json', { eager: true, import: 'default' });

// Helper to get tag name by ID
const getTagName = (tagId) => {
  const tag = TAGS_DATA.find(t => t.id === tagId);
  return tag ? tag.name : tagId;
};

// Helper to get subject name by ID
const getSubjectName = (subjectId) => {
  const sub = SUBJECTS_DATA.find(s => s.id === subjectId);
  return sub ? sub.name : subjectId;
};

// --- COMPONENTS ---
const PracticeCard = ({ practice, isSelected, isMultiSelectMode, toggleSelection, onSelect }) => {
  return (
    <button
      onClick={() => {
        if (isMultiSelectMode) {
          toggleSelection(practice.id);
        } else {
          onSelect(practice);
        }
      }}
      className={`practice-card group ${isMultiSelectMode && isSelected ? 'selected' : ''}`}
    >
      <div style={{width: '100%'}}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
           <h3 style={{ margin: 0 }}>{practice.title}</h3>
           {practice.subject && (
             <span className="subject-badge">{getSubjectName(practice.subject)}</span>
           )}
        </div>
        
        <div className="card-meta">
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                 {practice.type === 'flashcard' ? <BookOpen size={14} /> : <Brain size={14} />}
                 <span className="tag-count">
                    {practice.questions ? practice.questions.length : 0}
                 </span>
            </div>

            {practice.tags && practice.tags.length > 0 && (
                <div className="tags-list">
                    {practice.tags.map(tagId => (
                        <span key={tagId} className="tag-pill">
                            <Tag size={10} style={{marginRight:3}}/>
                            {getTagName(tagId)}
                        </span>
                    ))}
                </div>
            )}
        </div>
      </div>

      {isMultiSelectMode ? (
        <div style={{ fontSize: '1.5rem', marginLeft: '10px' }}>
          {isSelected ? <CheckSquare size={20} /> : <Square size={20} />}
        </div>
      ) : (
        <ChevronRight size={18} style={{marginLeft: '10px', opacity: 0.5}} />
      )}
    </button>
  );
};

const HomeView = ({ onSelectPractice, onGoAdmin, firebaseFlashcards }) => {
  const [activeSubject, setActiveSubject] = useState('all');
  const [selectionMode, setSelectionMode] = useState(null);
  const [selectedIds, setSelectedIds] = useState(new Set());

  // Combine Local Quizzes + Firebase Flashcards
  const allPractices = useMemo(() => {
    return [...QUIZ_DATA, ...firebaseFlashcards];
  }, [firebaseFlashcards]);

  // Filter Logic
  const filteredPractices = useMemo(() => {
    if (activeSubject === 'all') return allPractices;
    return allPractices.filter(p => p.subject === activeSubject || !p.subject); 
  }, [activeSubject, allPractices]);

  const flashcards = filteredPractices.filter(p => p.type === 'flashcard');
  const quizzes = filteredPractices.filter(p => p.type === 'quiz');

  const toggleSelection = (id) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const handleMixToggle = (type) => {
    if (selectionMode === type) {
      setSelectionMode(null);
      setSelectedIds(new Set());
    } else {
      setSelectionMode(type);
      setSelectedIds(new Set());
    }
  };

  const startCombined = () => {
    const selectedPractices = allPractices.filter(p => selectedIds.has(p.id));
    if (selectedPractices.length === 0) return;

    const combinedPractice = {
      id: 'combined-' + Date.now(),
      title: 'CUSTOM MIX',
      description: `Combined session of ${selectedPractices.length} topics.`,
      questions: selectedPractices.flatMap(p => p.questions),
      type: selectionMode
    };
    onSelectPractice(combinedPractice);
  };

  return (
    <div className="app-container">
      <div className="home-header">
        <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
            <h1 className="brand-title">Học Cùng Cô Quốc Anh &#128513;</h1>
            {/* Admin Button */}
            <button onClick={onGoAdmin} className="icon-btn" title="Manage Content">
                <Settings size={20} />
            </button>
        </div>
        
        <div className="filter-bar">
          <div className="filter-label"><Filter size={16}/> Môn học:</div>
          <div className="filter-options">
            <button 
                className={`filter-chip ${activeSubject === 'all' ? 'active' : ''}`}
                onClick={() => setActiveSubject('all')}
            >
                ALL
            </button>
            {SUBJECTS_DATA.map(sub => (
                <button 
                    key={sub.id}
                    className={`filter-chip ${activeSubject === sub.id ? 'active' : ''}`}
                    onClick={() => setActiveSubject(sub.id)}
                >
                    {sub.name}
                </button>
            ))}
          </div>
        </div>
      </div>

      <div className="split-view-container">
        
        {/* Left Column: Flashcards (Now from Firebase) */}
        <div className="split-column">
            <div className="column-header" style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                <div style={{display:'flex', alignItems:'center', gap:'10px'}}>
                    <h2 className='toggle-btn'>Thẻ Nhớ</h2>
                </div>
                <button 
                    onClick={() => handleMixToggle('flashcard')}
                    disabled={selectionMode === 'quiz'}
                    className={`toggle-btn ${selectionMode === 'flashcard' ? 'active' : ''}`}
                    style={{ 
                        fontSize: '0.8rem', 
                        padding: '6px 12px',
                        opacity: selectionMode === 'quiz' ? 0.3 : 1
                    }}
                >
                    <Layers size={14} style={{marginRight: 6}} />
                    {selectionMode === 'flashcard' ? 'Cancel' : 'Mix'}
                </button>
            </div>
            <div className="practice-list">
                {flashcards.length === 0 ? (
                    <p className="empty-msg">No flashcards found. (Check Admin)</p>
                ) : (
                    flashcards.map(p => (
                        <PracticeCard 
                            key={p.id} 
                            practice={p}
                            isMultiSelectMode={selectionMode === 'flashcard'}
                            isSelected={selectedIds.has(p.id)}
                            toggleSelection={toggleSelection}
                            onSelect={onSelectPractice}
                        />
                    ))
                )}
            </div>
        </div>

        {/* Right Column: Quizzes (Still Local) */}
        <div className="split-column">
            <div className="column-header" style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                <div style={{display:'flex', alignItems:'center', gap:'10px'}}>
                    <h2 className='toggle-btn'>Trắc Nghiệm</h2>
                </div>
                <button 
                    onClick={() => handleMixToggle('quiz')}
                    disabled={selectionMode === 'flashcard'}
                    className={`toggle-btn ${selectionMode === 'quiz' ? 'active' : ''}`}
                    style={{ 
                        fontSize: '0.8rem', 
                        padding: '6px 12px',
                        opacity: selectionMode === 'flashcard' ? 0.3 : 1
                    }}
                >
                    <Layers size={14} style={{marginRight: 6}} />
                    {selectionMode === 'quiz' ? 'Cancel' : 'Mix'}
                </button>
            </div>
            <div className="practice-list">
                {quizzes.length === 0 ? (
                    <p className="empty-msg">No quizzes found.</p>
                ) : (
                    quizzes.map(p => (
                        <PracticeCard 
                            key={p.id} 
                            practice={p}
                            isMultiSelectMode={selectionMode === 'quiz'}
                            isSelected={selectedIds.has(p.id)}
                            toggleSelection={toggleSelection}
                            onSelect={onSelectPractice}
                        />
                    ))
                )}
            </div>
        </div>

      </div>

      {selectionMode && selectedIds.size > 0 && (
        <div className="fab-container">
          <button onClick={startCombined} className="fab-btn">
            <Play fill="currentColor" size={20} />
            Start {selectionMode === 'flashcard' ? 'Flashcard' : 'Quiz'} Mix ({selectedIds.size})
          </button>
        </div>
      )}
    </div>
  );
};

export default function App() {
  const [activePractice, setActivePractice] = useState(null);
  const [showAdmin, setShowAdmin] = useState(false);
  const [firebaseFlashcards, setFirebaseFlashcards] = useState([]);

  // Fetch Flashcards from Firebase on Mount
  useEffect(() => {
    const loadFlashcards = async () => {
      const data = await getAllFlashcards();
      setFirebaseFlashcards(data);
    };
    loadFlashcards();
  }, [showAdmin]); // Reload when exiting admin in case data changed

  // --- RENDER ---

  if (showAdmin) {
    return <AdminDashboard onBack={() => setShowAdmin(false)} />;
  }

  if (activePractice) {
    return activePractice.type === 'flashcard' ? (
      <FlashcardSession 
        data={activePractice}
        onHome={() => setActivePractice(null)}
      />
    ) : (
      <QuizSession 
        data={activePractice} 
        onHome={() => setActivePractice(null)} 
      />
    );
  }

  return (
    <main>
      <HomeView 
        onSelectPractice={setActivePractice} 
        onGoAdmin={() => setShowAdmin(true)}
        firebaseFlashcards={firebaseFlashcards}
      />
    </main>
  );
}