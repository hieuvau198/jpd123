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
  const [isMultiSelectMode, setIsMultiSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState(new Set());

  // Filter Logic
  const filteredPractices = useMemo(() => {
    if (activeSubject === 'all') return ALL_PRACTICES;
    return ALL_PRACTICES.filter(p => p.subject === activeSubject || !p.subject); 
    // Note: "!p.subject" handles "if dont have, we default view it" if interpreted as showing them in filtered views too.
    // If you strictly want ONLY that subject, remove "|| !p.subject".
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

  const startCombined = () => {
    const selectedPractices = ALL_PRACTICES.filter(p => selectedIds.has(p.id));
    if (selectedPractices.length === 0) return;

    // Determine type based on selection (majority or default to mix)
    // For simplicity, if mixing types is allowed, we might need a unified session.
    // Assuming mostly one type for now or standard quiz engine.
    const combinedPractice = {
      id: 'combined-' + Date.now(),
      title: 'CUSTOM MIX',
      description: `Combined session of ${selectedPractices.length} topics.`,
      questions: selectedPractices.flatMap(p => p.questions),
      type: selectedPractices[0].type // Naive type selection
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

        {/* Mix Button */}
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: '20px' }}>
            <button
            onClick={() => {
                setIsMultiSelectMode(!isMultiSelectMode);
                setSelectedIds(new Set());
            }}
            className={`toggle-btn ${isMultiSelectMode ? 'active' : ''}`}
            >
            <Layers size={18} />
            {isMultiSelectMode ? 'Cancel Mix' : 'Create Custom Mix'}
            </button>
        </div>
      </div>

      {/* --- SPLIT VIEW --- */}
      <div className="split-view-container">
        
        {/* Left Column: Flashcards */}
        <div className="split-column">
            <div className="column-header">
                <BookOpen size={24}/>
                <h2>FLASHCARDS</h2>
            </div>
            <div className="practice-list">
                {flashcards.length === 0 ? (
                    <p className="empty-msg">No flashcards found.</p>
                ) : (
                    flashcards.map(p => (
                        <PracticeCard 
                            key={p.id} 
                            practice={p}
                            isMultiSelectMode={isMultiSelectMode}
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
            <div className="column-header">
                <Brain size={24}/>
                <h2>QUIZZES</h2>
            </div>
            <div className="practice-list">
                {quizzes.length === 0 ? (
                    <p className="empty-msg">No quizzes found.</p>
                ) : (
                    quizzes.map(p => (
                        <PracticeCard 
                            key={p.id} 
                            practice={p}
                            isMultiSelectMode={isMultiSelectMode}
                            isSelected={selectedIds.has(p.id)}
                            toggleSelection={toggleSelection}
                            onSelect={onSelectPractice}
                        />
                    ))
                )}
            </div>
        </div>

      </div>

      {isMultiSelectMode && selectedIds.size > 0 && (
        <div className="fab-container">
          <button onClick={startCombined} className="fab-btn">
            <Play fill="currentColor" size={20} />
            Start Mix ({selectedIds.size})
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