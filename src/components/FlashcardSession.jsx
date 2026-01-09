import React, { useState, useEffect, useRef } from 'react';
import { Home, RefreshCw, ArrowRight, ArrowLeft, RotateCcw, Keyboard, Layers, ArrowRightLeft } from 'lucide-react';

// Utility to remove Vietnamese tones for flexible matching
const removeVietnameseTones = (str) => {
  if (!str) return "";
  str = str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  str = str.replace(/đ/g, "d").replace(/Đ/g, "D");
  return str.toLowerCase().trim();
};

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
  // Mode: 'view' (flip cards) or 'speak' (fill in the blank)
  const [mode, setMode] = useState(null); 
  // Direction: 'vi_en' (Viet -> Eng) or 'en_vi' (Eng -> Viet)
  const [direction, setDirection] = useState(null); 

  const [queue, setQueue] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  
  // Speaking/Fill Mode States
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
    if (mode === 'speak' && direction && feedback !== 'wrong' && inputRef.current) {
      inputRef.current.focus();
    }
  }, [currentIndex, mode, direction, feedback]);

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
    const userAns = inputValue; 

    let isCorrect = false;
    let correctString = "";

    // LOGIC BASED ON DIRECTION
    if (direction === 'vi_en') {
      // Prompt: Vietnamese -> Expect: English
      // Strict(ish) match for English (usually single answer)
      const target = (currentCard.speak || "").toLowerCase().trim();
      const input = userAns.toLowerCase().trim();
      isCorrect = input === target;
      correctString = currentCard.speak;
    } else {
      // Prompt: English -> Expect: Vietnamese
      // 1. Split by "/" to support multiple definitions (e.g. "Làm ơn / Vui lòng")
      const rawAnswers = (currentCard.answer || "").split('/');
      
      // 2. Normalize input
      const input = removeVietnameseTones(userAns);

      // 3. Check if input matches ANY of the split segments
      isCorrect = rawAnswers.some(ans => {
        const target = removeVietnameseTones(ans);
        return input === target;
      });

      correctString = currentCard.answer;
    }

    if (isCorrect) {
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
      setCorrectAnswerDisplay(correctString);
      
      // Delay before moving next and requeueing
      setTimeout(() => {
        // Add current card to end of queue (retry later)
        setQueue(prev => [...prev, currentCard]);
        
        setFeedback('neutral');
        setCorrectAnswerDisplay("");
        setInputValue("");
        setCurrentIndex(prev => prev + 1);
      }, 2500);
    }
  };

  if (!data) return null;

  // --- 1. MAIN SELECTION SCREEN ---
  if (!mode) {
    return (
      <div className="app-container" style={{ textAlign: 'center', color: 'white' }}>
        <h1 className="session-title" style={{marginBottom: '20px'}}>{data.title}</h1>
        <p style={{marginBottom: '40px'}}>{data.description}</p>
        
        <div className="mode-selection">
          <button onClick={() => setMode('view')} className="mode-card">
            <Layers size={48} />
            <h3>Flashcard</h3>
            <p>Lật thẻ, học từ vựng.</p>
          </button>
          
          <button onClick={() => setMode('speak')} className="mode-card">
            <Keyboard size={48} />
            <h3>Điền Từ</h3>
            <p>Kiểm tra trí nhớ, gõ từ.</p>
          </button>
        </div>

        <button onClick={onHome} className="btn-secondary" style={{margin: '40px auto'}}>
          <Home size={18} /> Back to Home
        </button>
      </div>
    );
  }

  // --- 2. SUB-SELECTION (DIRECTION) FOR "ĐIỀN TỪ" ---
  if (mode === 'speak' && !direction) {
    return (
      <div className="app-container" style={{ textAlign: 'center', color: 'white' }}>
        <h2 className="session-title" style={{marginBottom: '30px'}}>Chọn chế độ Điền Từ</h2>
        
        <div className="mode-selection">
          <button onClick={() => setDirection('vi_en')} className="mode-card">
            <ArrowRightLeft size={48} />
            <h3>Tiếng Việt → Tiếng Anh</h3>
            <p>Hiện nghĩa tiếng Việt, bạn gõ từ tiếng Anh.</p>
          </button>
          
          <button onClick={() => setDirection('en_vi')} className="mode-card">
            <ArrowRightLeft size={48} />
            <h3>Tiếng Anh → Tiếng Việt</h3>
            <p>Hiện từ tiếng Anh, bạn gõ nghĩa tiếng Việt.</p>
            <p style={{fontSize: '0.8em', opacity: 0.8}}>(Chấp nhận một trong các nghĩa)</p>
          </button>
        </div>

        <button onClick={() => setMode(null)} className="btn-secondary" style={{margin: '40px auto'}}>
           Cancel
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
          <h2>Hoàn thành!</h2>
          <div className="action-buttons" style={{marginTop: '20px'}}>
             <button onClick={onHome} className="btn-secondary">
              <Home size={18} /> Home
            </button>
            <button onClick={() => {
              // Restart with SHUFFLE
              setQueue(shuffleArray([...data.questions]));
              setCurrentIndex(0);
              // Reset only logic states, keep mode/direction if desired, or reset all
              setDirection(null); 
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

  // --- VIEW MODE RENDER (FLASHCARD) ---
  if (mode === 'view') {
    return (
      <div className="app-container">
        <div className="progress-header">
          <button onClick={onHome}><Home size={18} /> EXIT</button>
          <span style={{fontWeight: '700'}}>{currentIndex + 1} / {queue.length}</span>
        </div>

        <div className="flashcard-container" onClick={() => setIsFlipped(!isFlipped)}>
          <div className={`flashcard-inner ${isFlipped ? 'flipped' : ''}`}>
            <div className="flashcard-front">
              {/* Standard Question Display */}
              <h2 className="fc-text">{currentCard.question}</h2>
              <div className="fc-hint">Click or Space to Flip</div>
            </div>
            <div className="flashcard-back">
              <h2 className="fc-text" style={{marginBottom: '10px'}}>{currentCard.speak}</h2>
              <p className="fc-sub" style={{marginTop: '0'}}>{currentCard.answer}</p>
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

  // --- SPEAKING / FILL MODE RENDER ---
  const displayQuestion = direction === 'vi_en' ? currentCard.answer : currentCard.speak;
  const inputPlaceholder = direction === 'vi_en' ? "Nhập từ tiếng Anh..." : "Nhập nghĩa tiếng Việt...";
  const subText = direction === 'vi_en' ? "Nhập từ tiếng Anh tương ứng" : "Nhập nghĩa tiếng Việt (có thể không dấu)";

  return (
    <div className="app-container">
       <div className="progress-header">
          <button onClick={() => { setDirection(null); setMode(null); }}><Home size={18} /> EXIT</button>
          <span style={{fontWeight: '700'}}>{currentIndex + 1} / {queue.length}</span>
      </div>

      <div className="question-card" style={{alignItems: 'center', justifyContent: 'center', textAlign: 'center'}}>
        <h2 className="question-text" style={{marginBottom: '10px'}}>{displayQuestion}</h2>
        <p style={{color: '#666', marginBottom: '30px'}}>{subText}</p>

        {feedback === 'wrong' ? (
           <div className="feedback-error">
              <p>Đáp án đúng: <strong>{correctAnswerDisplay}</strong></p>
           </div>
        ) : (
          <form onSubmit={handleSpeakSubmit} style={{width: '100%', maxWidth: '400px'}}>
            <input
              ref={inputRef}
              type="text"
              className={`speak-input ${feedback === 'correct' ? 'input-correct' : ''}`}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder={inputPlaceholder}
              disabled={feedback !== 'neutral'}
              autoComplete="off"
            />
          </form>
        )}
        
        {feedback === 'correct' && <div style={{marginTop: '20px', color: 'green', fontWeight: 'bold'}}>CHÍNH XÁC!</div>}
      </div>
    </div>
  );
};

export default FlashcardSession;