import React, { useState, useEffect, useRef } from 'react';
import { Home, RefreshCw, ArrowRight, ArrowLeft, RotateCcw, Keyboard, Layers, Volume2 } from 'lucide-react';

// Utility to shuffle questions
const shuffleArray = (array) => {
  const newArr = [...array];
  for (let i = newArr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArr[i], newArr[j]] = [newArr[j], newArr[i]];
  }
  return newArr;
};

const FlashcardSession = ({ data, onHome }) => {
  // Mode: 'view' (flip cards) or 'speak' (typing test)
  const [mode, setMode] = useState(null); // null = selection screen
  const [queue, setQueue] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  
  // Speaking Mode States
  const [inputValue, setInputValue] = useState("");
  const [feedback, setFeedback] = useState("neutral"); // neutral, correct, wrong
  const [correctAnswerDisplay, setCorrectAnswerDisplay] = useState("");
  const inputRef = useRef(null);

  // Initialize data with SHUFFLE
  useEffect(() => {
    if (data && data.questions) {
      setQueue(shuffleArray([...data.questions]));
    }
  }, [data]);

  // Focus input in speak mode
  useEffect(() => {
    if (mode === 'speak' && feedback !== 'wrong' && inputRef.current) {
      inputRef.current.focus();
    }
  }, [currentIndex, mode, feedback]);

  // Keyboard navigation for View Mode
  useEffect(() => {
    if (mode !== 'view') return;

    const handleKeyDown = (e) => {
      if (e.code === 'Space') {
        e.preventDefault();
        setIsFlipped(prev => !prev);
      } else if (e.code === 'ArrowRight') {
        handleNext();
      } else if (e.code === 'ArrowLeft') {
        handlePrev();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [mode, currentIndex]);

  const handleNext = () => {
    if (currentIndex < queue.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setIsFlipped(false);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
      setIsFlipped(false);
    }
  };

  const handleSpeakSubmit = (e) => {
    e.preventDefault();
    if (feedback !== 'neutral') return;

    const currentCard = queue[currentIndex];
    // Normalize: lowercase, trim whitespace
    const userAns = inputValue.toLowerCase().trim();
    const correctAns = (currentCard.speak || "").toLowerCase().trim();

    if (userAns === correctAns) {
      setFeedback('correct');
      setTimeout(() => {
        setFeedback('neutral');
        setInputValue("");
        if (currentIndex < queue.length - 1) {
          setCurrentIndex(prev => prev + 1);
        } else {
          // Finished queue
          setCurrentIndex(prev => prev + 1); 
        }
      }, 800);
    } else {
      setFeedback('wrong');
      setCorrectAnswerDisplay(currentCard.speak);
      
      // Delay before moving next and requeueing
      setTimeout(() => {
        // Add current card to end of queue (retry later)
        setQueue(prev => [...prev, currentCard]);
        
        setFeedback('neutral');
        setCorrectAnswerDisplay("");
        setInputValue("");
        setCurrentIndex(prev => prev + 1);
      }, 2000);
    }
  };

  if (!data) return null;

  // --- SELECTION SCREEN ---
  if (!mode) {
    return (
      <div className="app-container" style={{ textAlign: 'center', color: 'white' }}>
        <h1 style={{fontSize: '2.5rem', marginBottom: '20px'}}>{data.title}</h1>
        <p style={{marginBottom: '40px'}}>{data.description}</p>
        
        <div className="mode-selection">
          <button onClick={() => setMode('view')} className="mode-card">
            <Layers size={48} />
            <h3>Flashcard Mode</h3>
            <p>Flip cards, learn at your pace.</p>
          </button>
          
          <button onClick={() => setMode('speak')} className="mode-card">
            <Keyboard size={48} />
            <h3>Speaking Test</h3>
            <p>Type the reading (Romaji).</p>
          </button>
        </div>

        <button onClick={onHome} className="btn-secondary" style={{margin: '40px auto'}}>
          <Home size={18} /> Back to Home
        </button>
      </div>
    );
  }

  // --- COMPLETED SCREEN ---
  if (currentIndex >= queue.length) {
    return (
      <div className="app-container">
        <div className="result-box">
          <RefreshCw size={60} />
          <h2>All Cards Reviewed</h2>
          <div className="action-buttons" style={{marginTop: '20px'}}>
             <button onClick={onHome} className="btn-secondary">
              <Home size={18} /> Home
            </button>
            <button onClick={() => {
              // Restart with SHUFFLE
              setQueue(shuffleArray([...data.questions]));
              setCurrentIndex(0);
              setMode(null);
            }} className="btn-primary">
              <RotateCcw size={18} /> Restart
            </button>
          </div>
        </div>
      </div>
    );
  }

  const currentCard = queue[currentIndex];

  // --- VIEW MODE RENDER ---
  if (mode === 'view') {
    return (
      <div className="app-container">
        <div className="progress-header">
          <button onClick={onHome}><Home size={18} /> EXIT</button>
          <span style={{fontWeight: '700'}}>{currentIndex + 1} / {queue.length}</span>
        </div>

        <div className="flashcard-container" onClick={() => setIsFlipped(!isFlipped)}>
          <div className={`flashcard-inner ${isFlipped ? 'flipped' : ''}`}>
            {/* FRONT OF CARD */}
            <div className="flashcard-front">
              <h2 className="fc-text">{currentCard.question}</h2>
              <div className="fc-hint">Click or Space to Flip</div>
            </div>
            {/* BACK OF CARD - SPEAKING FIRST */}
            <div className="flashcard-back">
              <h2 className="fc-text" style={{marginBottom: '10px'}}>{currentCard.speak}</h2>
              <p className="fc-sub" style={{marginTop: '0', fontSize: '1.2rem'}}>{currentCard.answer}</p>
            </div>
          </div>
        </div>

        <div className="fc-controls">
          <button onClick={(e) => { e.stopPropagation(); handlePrev(); }} disabled={currentIndex === 0}>
            <ArrowLeft /> Prev
          </button>
          <button onClick={(e) => { e.stopPropagation(); setIsFlipped(!isFlipped); }}>
            <RotateCcw size={18} /> Flip
          </button>
          <button onClick={(e) => { e.stopPropagation(); handleNext(); }} disabled={currentIndex === queue.length - 1}>
            Next <ArrowRight />
          </button>
        </div>
      </div>
    );
  }

  // --- SPEAKING MODE RENDER ---
  return (
    <div className="app-container">
       <div className="progress-header">
          <button onClick={onHome}><Home size={18} /> EXIT</button>
          <span style={{fontWeight: '700'}}>{currentIndex + 1} / {queue.length}</span>
      </div>

      <div className="question-card" style={{alignItems: 'center', justifyContent: 'center', textAlign: 'center'}}>
        <h2 className="question-text" style={{fontSize: '3rem', marginBottom: '10px'}}>{currentCard.question}</h2>
        <p style={{color: '#666', marginBottom: '30px'}}>Type the reading (Romaji)</p>

        {feedback === 'wrong' ? (
           <div className="feedback-error">
              <p>Correct: <strong>{correctAnswerDisplay}</strong></p>
           </div>
        ) : (
          <form onSubmit={handleSpeakSubmit} style={{width: '100%', maxWidth: '400px'}}>
            <input
              ref={inputRef}
              type="text"
              className={`speak-input ${feedback === 'correct' ? 'input-correct' : ''}`}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Type answer..."
              disabled={feedback !== 'neutral'}
              autoComplete="off"
            />
          </form>
        )}
        
        {feedback === 'correct' && <div style={{marginTop: '20px', color: 'green', fontWeight: 'bold'}}>CORRECT!</div>}
      </div>
    </div>
  );
};

export default FlashcardSession;