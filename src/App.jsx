import React, { useState, useMemo } from 'react';
import { Layers, ChevronRight, CheckSquare, Square, Play, BookOpen, Brain, ArrowLeft, Filter, Tag } from 'lucide-react';
import './App.css'; 
import QuizSession from './components/QuizSession';
import FlashcardSession from './components/FlashcardSession';

// --- SYSTEM DATA IMPORTS ---
// Ensure these files exist in your project structure
import SUBJECTS_DATA from './data/system/subjects.json';
import TAGS_DATA from './data/system/tags.json';

// --- DATA LOADING ---
const quizImports = import.meta.glob('./data/quiz/*.json', { eager: true, import: 'default' });
const flashcardImports = import.meta.glob('./data/flashcard/*.json', { eager: true, import: 'default' });

// Add type to data objects
const QUIZ_DATA = Object.values(quizImports).map(d => ({ ...d, type: 'quiz' }));
const FLASHCARD_DATA = Object.values(flashcardImports).map(d => ({ ...d, type: 'flashcard' }));

const ALL_PRACTICES = [...QUIZ_DATA, ...FLASHCARD_DATA];

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
        <div className="card-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {practice.type === 'flashcard' ? <BookOpen size={16} /> : <Brain size={16} />}
            <span className="card-type-label">
              {practice.type === 'flashcard' ? 'FLASHCARD' : 'QUIZ'}
            </span>
          </div>
          {/* Subject Label */}
          {practice.subject && (
             <span className="subject-badge">{getSubjectName(practice.subject)}</span>
          )}
        </div>

        <h3>{practice.title}</h3>
        <p>{practice.description}</p>
        
        <div className="card-meta">
            <span className="tag-count">
                {practice.questions ? practice.questions.length : 0} ITEMS
            </span>
            {/* Render Tags */}
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
          {isSelected ? <CheckSquare /> : <Square />}
        </div>
      ) : (
        <ChevronRight style={{marginLeft: '10px'}} />
      )}
    </button>
  );
};

const HomeView = ({ onSelectPractice }) => {
  const [activeSubject, setActiveSubject] = useState('all');
  
  // Changed from boolean to explicit type: 'flashcard' | 'quiz' | null
  const [selectionMode, setSelectionMode] = useState(null);
  const [selectedIds, setSelectedIds] = useState(new Set());

  // Filter Logic
  const filteredPractices = useMemo(() => {
    if (activeSubject === 'all') return ALL_PRACTICES;
    return ALL_PRACTICES.filter(p => p.subject === activeSubject || !p.subject); 
  }, [activeSubject]);

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

  // Handles activating the mix mode for a specific type
  const handleMixToggle = (type) => {
    if (selectionMode === type) {
      // Cancel current selection
      setSelectionMode(null);
      setSelectedIds(new Set());
    } else {
      // Switch to new type and clear previous selections
      setSelectionMode(type);
      setSelectedIds(new Set());
    }
  };

  const startCombined = () => {
    const selectedPractices = ALL_PRACTICES.filter(p => selectedIds.has(p.id));
    if (selectedPractices.length === 0) return;

    const combinedPractice = {
      id: 'combined-' + Date.now(),
      title: 'CUSTOM MIX',
      description: `Combined session of ${selectedPractices.length} topics.`,
      questions: selectedPractices.flatMap(p => p.questions),
      // We can now safely assume the type based on the active mode
      type: selectionMode
    };
    onSelectPractice(combinedPractice);
  };

  return (
    <div className="app-container">
      <div className="home-header">
        <h1 className="brand-title">DASHBOARD</h1>
        
        {/* --- SUBJECT FILTER --- */}
        <div className="filter-bar">
          <div className="filter-label"><Filter size={16}/> SUBJECT:</div>
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

        {/* Removed central 'Create Custom Mix' button to separate them below */}
      </div>

      {/* --- SPLIT VIEW --- */}
      <div className="split-view-container">
        
        {/* Left Column: Flashcards */}
        <div className="split-column">
            <div className="column-header" style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                <div style={{display:'flex', alignItems:'center', gap:'10px'}}>
                    <BookOpen size={24}/>
                    <h2>FLASHCARDS</h2>
                </div>
                {/* Flashcard Mix Button */}
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
                    <p className="empty-msg">No flashcards found.</p>
                ) : (
                    flashcards.map(p => (
                        <PracticeCard 
                            key={p.id} 
                            practice={p}
                            // Only allow multi-select if we are in flashcard mode
                            isMultiSelectMode={selectionMode === 'flashcard'}
                            isSelected={selectedIds.has(p.id)}
                            toggleSelection={toggleSelection}
                            onSelect={onSelectPractice}
                        />
                    ))
                )}
            </div>
        </div>

        {/* Right Column: Quizzes */}
        <div className="split-column">
            <div className="column-header" style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                <div style={{display:'flex', alignItems:'center', gap:'10px'}}>
                    <Brain size={24}/>
                    <h2>QUIZZES</h2>
                </div>
                {/* Quiz Mix Button */}
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
                            // Only allow multi-select if we are in quiz mode
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
            {/* Dynamic Label */}
            Start {selectionMode === 'flashcard' ? 'Flashcard' : 'Quiz'} Mix ({selectedIds.size})
          </button>
        </div>
      )}
    </div>
  );
};

export default function App() {
  const [activePractice, setActivePractice] = useState(null);

  return (
    <div>
      <main>
        {activePractice ? (
          activePractice.type === 'flashcard' ? (
            <FlashcardSession 
                data={activePractice}
                onHome={() => setActivePractice(null)}
            />
          ) : (
            <QuizSession 
                data={activePractice} 
                onHome={() => setActivePractice(null)} 
            />
          )
        ) : (
            <HomeView onSelectPractice={setActivePractice} />
        )}
      </main>
    </div>
  );
}