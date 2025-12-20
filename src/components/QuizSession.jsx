import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Home, RefreshCw, Brain, ArrowRight } from 'lucide-react';

const shuffleArray = (array) => {
  const newArr = [...array];
  for (let i = newArr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArr[i], newArr[j]] = [newArr[j], newArr[i]];
  }
  return newArr;
};

const prepareSessionData = (originalData) => {
  const rawQuestions = Array.isArray(originalData) 
    ? originalData.flatMap(d => d.questions) 
    : (originalData.questions || []);

  if (rawQuestions.length === 0) return [];
  
  const shuffledQuestions = shuffleArray(rawQuestions);

  return shuffledQuestions.map(q => ({
    ...q,
    _tempId: Math.random().toString(36).substr(2, 9), 
    options: shuffleArray(q.options)
  }));
};

const QuizSession = ({ data, onHome }) => {
  const [questions, setQuestions] = useState(() => prepareSessionData(data));
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0); 
  const [isFinished, setIsFinished] = useState(false);
  const [selectedOption, setSelectedOption] = useState(null);
  const [isWrong, setIsWrong] = useState(false);
  const [hasFailedCurrent, setHasFailedCurrent] = useState(false);

  if (!questions || questions.length === 0) {
    return <div className="app-container"><h2 style={{color: 'white'}}>Error: No questions found.</h2></div>;
  }

  const currentQuestion = questions[currentIndex];

  const handleOptionClick = (option) => {
    if (isWrong) return; 

    setSelectedOption(option);

    if (option === currentQuestion.correctAnswer) {
      if (!hasFailedCurrent) {
        setScore((prev) => prev + 1);
      }
      setTimeout(() => {
        handleNext();
      }, 500); 
    } else {
      setIsWrong(true);
      if (!hasFailedCurrent) {
        setHasFailedCurrent(true);
        setQuestions(prev => {
          const retryQuestion = { ...currentQuestion, _retry: true };
          return [...prev, retryQuestion];
        });
      }
    }
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (isFinished || isWrong || (selectedOption && selectedOption === currentQuestion.correctAnswer)) {
        return;
      }
      const key = e.key.toLowerCase();
      const indexMap = { '1': 0, '2': 1, '3': 2, '4': 3 };

      if (Object.prototype.hasOwnProperty.call(indexMap, key)) {
        const index = indexMap[key];
        if (index < currentQuestion.options.length) {
          handleOptionClick(currentQuestion.options[index]);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, isFinished, isWrong, selectedOption, currentQuestion]);

  const handleNext = () => {
    const nextIndex = currentIndex + 1;
    if (nextIndex < questions.length) {
      setCurrentIndex(nextIndex);
      setSelectedOption(null);
      setIsWrong(false);
      setHasFailedCurrent(false);
    } else {
      setIsFinished(true);
    }
  };

  const restart = () => {
    setQuestions(prepareSessionData(data));
    setCurrentIndex(0);
    setScore(0);
    setIsFinished(false);
    setSelectedOption(null);
    setIsWrong(false);
    setHasFailedCurrent(false);
  };

  if (isFinished) {
    return (
      <div className="app-container">
        <div className="result-box">
          <div style={{ color: 'black', marginBottom: '20px' }}>
            <CheckCircle size={60} strokeWidth={1.5} />
          </div>
          <h2>SESSION COMPLETE</h2>
          <p style={{ color: '#666', marginBottom: '20px' }}>
            You have successfully mastered all questions.
          </p>
          <div className="score-display">
             Mastery Score <span className="score-number">{score}</span>
          </div>
          
          <div className="action-buttons">
            <button onClick={onHome} className="btn-secondary">
              <Home size={18} /> Home
            </button>
            <button onClick={restart} className="btn-primary">
              <RefreshCw size={18} /> Restart
            </button>
          </div>
        </div>
      </div>
    );
  }

  const progressPercent = ((currentIndex) / questions.length) * 100;

  return (
    <div className="app-container">
      <div className="progress-header">
        <button onClick={onHome}>
          <Home size={18} /> EXIT
        </button>
        <div style={{display: 'flex', gap: '15px', alignItems: 'center'}}>
          {hasFailedCurrent && <span style={{color: '#ff0000', fontWeight: 'bold', fontSize: '0.8rem'}}>RETRY MODE</span>}
          <span style={{fontWeight: '700'}}>{currentIndex + 1} / {questions.length}</span>
        </div>
      </div>
      <div className="progress-bar-bg">
        <div className="progress-bar-fill" style={{ width: `${progressPercent}%` }}></div>
      </div>

      <div className="question-card">
        <div className="card-content">
          <h2 className="question-text" style={{ whiteSpace: 'pre-wrap' }}>
            {currentQuestion.text}
          </h2>
          
          <div className="options-list">
            {currentQuestion.options.map((option, idx) => {
              const isSelected = selectedOption === option;
              const isCorrect = option === currentQuestion.correctAnswer;
              
              let btnClass = "option-btn";
              if (isSelected && isCorrect) btnClass += " selected-correct";
              else if (isSelected && !isCorrect) btnClass += " selected-wrong";
              else if (isWrong && isCorrect) btnClass += " reveal";

              return (
                <button
                  key={idx}
                  onClick={() => handleOptionClick(option)}
                  disabled={isWrong || (selectedOption && isCorrect)}
                  className={btnClass}
                >
                  <span>{option}</span>
                  {isSelected && isCorrect && <CheckCircle size={24} />}
                  {isSelected && !isCorrect && <XCircle size={24} />}
                </button>
              );
            })}
          </div>
        </div>

        {isWrong && (
          <div className="explanation-box">
            <div style={{ display: 'flex', gap: '15px' }}>
              <Brain size={24} color="black" />
              <div>
                <div className="explanation-header">INSIGHT</div>
                <div style={{ lineHeight: '1.6', color: '#444' }}>{currentQuestion.explanation}</div>
              </div>
            </div>
            <button onClick={handleNext} className="next-btn">
              NEXT <ArrowRight size={18} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default QuizSession;