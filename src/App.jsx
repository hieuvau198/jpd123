import React, { useState } from 'react';
import { Layers, ChevronRight, CheckSquare, Square, Play, BookOpen, Brain, ArrowLeft } from 'lucide-react';
import './App.css'; 
import QuizSession from './components/QuizSession';
import FlashcardSession from './components/FlashcardSession';

// --- DATA LOADING ---
const quizImports = import.meta.glob('./data/quiz/*.json', { eager: true, import: 'default' });
const flashcardImports = import.meta.glob('./data/flashcard/*.json', { eager: true, import: 'default' });

// Add type to data objects
const QUIZ_DATA = Object.values(quizImports).map(d => ({ ...d, type: 'quiz' }));
const FLASHCARD_DATA = Object.values(flashcardImports).map(d => ({ ...d, type: 'flashcard' }));

const ALL_PRACTICES = [...QUIZ_DATA, ...FLASHCARD_DATA];

// --- COMPONENTS ---

const CategorySelection = ({ onSelectCategory }) => {
  return (
    <div className="app-container">
      <div className="home-header">
        <h1 className="brand-title">CHOOSE MODE</h1>
        <p style={{color: 'white', marginBottom: '40px'}}>Select your training method</p>
        
        <div className="mode-selection">
          <button onClick={() => onSelectCategory('quiz')} className="mode-card">
            <Brain size={64} style={{marginBottom: '10px'}} />
            <h3>QUIZ MODE</h3>
            <p>Multiple choice questions to test your grammar and vocab.</p>
          </button>
          
          <button onClick={() => onSelectCategory('flashcard')} className="mode-card">
            <BookOpen size={64} style={{marginBottom: '10px'}} />
            <h3>FLASHCARD</h3>
            <p>Flip cards or take speaking tests to memorize words.</p>
          </button>
        </div>
      </div>
    </div>
  );
};

const PracticeList = ({ practices, category, onSelect, onBack }) => {
  const [isMultiSelectMode, setIsMultiSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState(new Set());

  // Filter practices based on selected category
  const filteredPractices = practices.filter(p => p.type === category);

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
    const selectedPractices = filteredPractices.filter(p => selectedIds.has(p.id));
    if (selectedPractices.length === 0) return;

    const combinedPractice = {
      id: 'combined-' + Date.now(),
      title: 'CUSTOM MIX',
      description: `Combined session of ${selectedPractices.length} topics.`,
      questions: selectedPractices.flatMap(p => p.questions),
      type: category
    };
    onSelect(combinedPractice);
  };

  // Only allow mixing for quizzes for now, or ensure flashcards have consistent structure
  const allowMix = category === 'quiz' || category === 'flashcard';

  return (
    <div className="app-container">
      <div className="home-header">
        <button onClick={onBack} className="back-btn" style={{position: 'absolute', top: '20px', left: '20px', background: 'transparent', border: 'none', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px', fontSize: '1rem', fontFamily: 'Oswald'}}>
             <ArrowLeft size={20} /> BACK
        </button>

        <h1 className="brand-title">{category === 'quiz' ? 'QUIZZES' : 'FLASHCARDS'}</h1>
        
        {allowMix && (
          <div style={{display: 'flex', justifyContent: 'center'}}>
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
        )}
      </div>

      <div className="practice-grid">
        {filteredPractices.length === 0 ? (
            <div style={{gridColumn: '1/-1', textAlign: 'center', color: 'white'}}>
                <h3>No content found for this category.</h3>
            </div>
        ) : (
            filteredPractices.map((practice, index) => {
            const isSelected = selectedIds.has(practice.id);
            const canSelect = isMultiSelectMode;

            return (
                <button
                key={practice.id || index}
                onClick={() => {
                    if (canSelect) {
                    toggleSelection(practice.id);
                    } else if (!isMultiSelectMode) {
                    onSelect(practice);
                    }
                }}
                className={`practice-card group ${canSelect && isSelected ? 'selected' : ''}`}
                >
                <div>
                    <div style={{display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '5px'}}>
                        {category === 'flashcard' ? <BookOpen size={16}/> : <Brain size={16}/>}
                        <span style={{fontSize: '0.8rem', fontWeight: 'bold', textTransform: 'uppercase'}}>
                            {category === 'flashcard' ? 'FLASHCARD' : 'QUIZ'}
                        </span>
                    </div>
                    <h3>{practice.title}</h3>
                    <p>{practice.description}</p>
                    <span className="tag">
                    {practice.questions ? practice.questions.length : 0} ITEMS
                    </span>
                </div>
                
                {canSelect ? (
                    <div style={{fontSize: '1.5rem'}}>
                    {isSelected ? <CheckSquare /> : <Square />}
                    </div>
                ) : (
                    !isMultiSelectMode && <ChevronRight />
                )}
                </button>
            );
            })
        )}
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
  const [category, setCategory] = useState(null); // 'quiz' | 'flashcard' | null

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
            // If no practice active, check category
            category ? (
                <PracticeList 
                    practices={ALL_PRACTICES} 
                    category={category}
                    onSelect={setActivePractice}
                    onBack={() => setCategory(null)}
                />
            ) : (
                <CategorySelection onSelectCategory={setCategory} />
            )
        )}
      </main>
    </div>
  );
}