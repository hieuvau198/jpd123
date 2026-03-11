import React, { useState, useEffect, useRef } from 'react';
import { Button, Typography, Progress, Card, message } from 'antd';
import { ArrowLeft, CheckCircle, XCircle } from 'lucide-react';
import { BlockMath, InlineMath } from 'react-katex';
import 'katex/dist/katex.min.css';
import SessionResult from '../../SessionResult';

const { Title, Text } = Typography;

const generateQuestions = (data) => {
  if (!data?.reactions || data.reactions.length === 0) return [];
  
  const shuffled = [...data.reactions].sort(() => 0.5 - Math.random());
  const types = ['element', 'compound', 'coefficient', 'subscript', 'valency'];

  return shuffled.map(reaction => {
      let prefix = "";
      let suffix = "";
      let answer = "";
      let questionText = "";
      let success = false;
      let chosenType = '';

      const attempts = [...types].sort(() => 0.5 - Math.random());

      for (let t of attempts) {
          if (success) break;

          if (t === 'valency') {
              const elements = Object.keys(reaction.valency || {});
              if (elements.length > 0) {
                  const el = elements[Math.floor(Math.random() * elements.length)];
                  answer = reaction.valency[el].toString();
                  questionText = `Hóa trị của ${el} trong phản ứng này?`;
                  chosenType = 'valency';
                  prefix = reaction.formula;
                  success = true;
              }
          } else if (t === 'subscript') {
              const regex = /_(\d|\{\d+\})/g;
              const matches = [...reaction.formula.matchAll(regex)];
              if (matches.length > 0) {
                  const match = matches[Math.floor(Math.random() * matches.length)];
                  answer = match[1].replace(/[{}]/g, '');
                  prefix = reaction.formula.substring(0, match.index);
                  suffix = reaction.formula.substring(match.index + match[0].length);
                  questionText = `Điền Hệ số dưới bị thiếu:`;
                  chosenType = 'subscript';
                  success = true;
              }
          } else if (t === 'coefficient') {
              const regex = /(?:^|\s|\+|\\rightarrow|\\xrightarrow\{[^}]*\})\s*(\d+)(?=[A-Z])/g;
              const matches = [...reaction.formula.matchAll(regex)];
              if (matches.length > 0) {
                  const match = matches[Math.floor(Math.random() * matches.length)];
                  answer = match[1];
                  const indexOfDigit = match[0].lastIndexOf(match[1]);
                  const globalIndex = match.index + indexOfDigit;
                  prefix = reaction.formula.substring(0, globalIndex);
                  suffix = reaction.formula.substring(globalIndex + match[1].length);
                  questionText = `Điền Hệ số bị thiếu:`;
                  chosenType = 'coefficient';
                  success = true;
              }
          } else if (t === 'element') {
              const elements = Object.keys(reaction.valency || {});
              if (elements.length > 0) {
                  const el = elements[Math.floor(Math.random() * elements.length)];
                  const regex = new RegExp(`${el}(?![a-z])`);
                  const match = reaction.formula.match(regex);
                  if (match) {
                      answer = el;
                      prefix = reaction.formula.substring(0, match.index);
                      suffix = reaction.formula.substring(match.index + match[0].length);
                      questionText = `Điền nguyên tố bị thiếu:`;
                      chosenType = 'element';
                      success = true;
                  }
              }
          } else if (t === 'compound') {
              const parts = reaction.formula.split(/(?:\+|\\rightarrow|\\xrightarrow\{.*?\})/);
              const compounds = parts.map(p => p.replace(/\\uparrow/g, '').replace(/\\downarrow/g, '').trim()).filter(p => p.length > 0 && p !== '\\Delta');
              if (compounds.length > 0) {
                  const selected = compounds[Math.floor(Math.random() * compounds.length)];
                  answer = selected;
                  const escapeRegExp = (string) => string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                  const regex = new RegExp(escapeRegExp(selected));
                  const match = reaction.formula.match(regex);
                  if (match) {
                      prefix = reaction.formula.substring(0, match.index);
                      suffix = reaction.formula.substring(match.index + match[0].length);
                      questionText = `Điền hợp chất bị thiếu:`;
                      chosenType = 'compound';
                      success = true;
                  }
              }
          }
      }

      if (!success) {
          chosenType = 'condition'; 
          questionText = `What is the condition for this reaction?`;
          answer = reaction.condition || "none";
          prefix = reaction.formula;
      }

      return {
          id: Math.random().toString(36).substr(2, 9),
          reaction,
          type: chosenType,
          questionText,
          prefix,
          suffix,
          answer: answer.toString().trim(),
          correctCountNeeded: 1 // Baseline: 1 correct answer to pass
      };
  });
};

const MissingSession = ({ data, onBack }) => {
  const [queue, setQueue] = useState([]);
  const [totalQuestions, setTotalQuestions] = useState(0);
  const [completedCount, setCompletedCount] = useState(0);
  
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [inputValue, setInputValue] = useState('');
  const [hasAnswered, setHasAnswered] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [isFinished, setIsFinished] = useState(false);

  const inputRef = useRef(null);

  useEffect(() => {
    if (data) {
      const initialQuestions = generateQuestions(data);
      setQueue(initialQuestions);
      setTotalQuestions(initialQuestions.length);
      setCurrentQuestion(initialQuestions[0]);
    }
  }, [data]);

  useEffect(() => {
    setInputValue('');
    setTimeout(() => {
      if (inputRef.current) inputRef.current.focus();
    }, 100);
  }, [currentQuestion]);

  const progressPercent = Math.round((completedCount / totalQuestions) * 100) || 0;

  const handleFocus = () => {
    if (inputRef.current && !hasAnswered) {
      inputRef.current.focus();
    }
  };

  const handleSubmit = () => {
    if (!inputValue.trim()) {
      message.warning('Please enter an answer!');
      return;
    }

    const normalizedUser = inputValue.replace(/\s+/g, '').toLowerCase();
    // Strip _, {, }, and ^ from the correct answer before comparing
    const normalizedAnswer = currentQuestion.answer.toString().replace(/[_\{\}\^\s]+/g, '').toLowerCase();

    setIsCorrect(normalizedUser === normalizedAnswer);
    setHasAnswered(true);
  };

  const handleNext = () => {
    let newQueue = [...queue];
    const answeredQuestion = newQueue.shift();

    if (isCorrect) {
      answeredQuestion.correctCountNeeded -= 1;
      
      if (answeredQuestion.correctCountNeeded <= 0) {
        setCompletedCount(prev => prev + 1);
      } else {
        const insertIndex = Math.min(2, newQueue.length);
        newQueue.splice(insertIndex, 0, answeredQuestion);
      }
    } else {
      answeredQuestion.correctCountNeeded = 2;
      const insertIndex = Math.min(2, newQueue.length);
      newQueue.splice(insertIndex, 0, answeredQuestion);
    }

    if (newQueue.length === 0) {
      setIsFinished(true);
    } else {
      setQueue(newQueue);
      setCurrentQuestion(newQueue[0]);
      setInputValue('');
      setHasAnswered(false);
      setIsCorrect(false);
    }
  };

  const handleRestart = () => {
    const initialQuestions = generateQuestions(data);
    setQueue(initialQuestions);
    setTotalQuestions(initialQuestions.length);
    setCurrentQuestion(initialQuestions[0]);
    setCompletedCount(0);
    setInputValue('');
    setHasAnswered(false);
    setIsCorrect(false);
    setIsFinished(false);
  };

  if (isFinished) {
    return (
      <SessionResult 
        score={100} 
        onBack={onBack} 
        onRestart={handleRestart} 
        practiceId={data?.id}
        practiceType="Chem Reaction"
        resultMessage={`Great job! You fully completed all ${totalQuestions} missing parts!`}
      />
    );
  }

  if (!currentQuestion) return <div className="p-8 text-center text-white">Loading questions...</div>;

  const isNonFormulaType = ['valency', 'condition'].includes(currentQuestion.type);
  
  // Create a clean version of the answer without LaTeX formatting characters for display and input limit
  const displayAnswer = currentQuestion.answer.toString().replace(/[_\{\}\^]/g, '');

  const renderMissingCharacters = () => {
    // Use the clean displayAnswer instead of the raw answer string
    const chars = displayAnswer.split('');
    
    return (
      <div className="flex items-center gap-1 mx-2" onClick={handleFocus} style={{ cursor: 'text' }}>
        {chars.map((char, index) => {
          const userChar = inputValue[index] || "";
          
          let color = '#fde047'; // Default yellow-300 matching inline math
          if (hasAnswered) {
             if (isCorrect) color = '#4ade80'; // green-400
             else color = '#f87171'; // red-400
          }

          return (
            <div key={index} className="flex flex-col items-center justify-end" style={{ width: '24px', height: '40px' }}>
              <Text style={{ 
                  fontSize: '24px', 
                  color: userChar || (hasAnswered && !isCorrect) ? color : '#9ca3af',
                  fontWeight: 'bold',
                  lineHeight: '1',
                  fontFamily: 'monospace'
              }}>
                  {(hasAnswered && !isCorrect) ? char : (userChar || "_")}
              </Text>
              <div style={{ 
                  width: '100%', 
                  height: '3px', 
                  background: userChar || (hasAnswered && !isCorrect) ? color : '#9ca3af',
                  borderRadius: '2px',
                  marginTop: '4px'
              }} />
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="min-h-screen p-4 sm:p-8 max-w-3xl mx-auto flex flex-col">
      <input
        ref={inputRef}
        type="text"
        value={inputValue}
        onChange={(e) => {
            if (hasAnswered) return;
            const val = e.target.value;
            // Use displayAnswer.length to limit input length instead of raw answer length
            if (val.length <= displayAnswer.length) {
                setInputValue(val);
            }
        }}
        onKeyDown={(e) => {
            if (e.key === 'Enter') {
                if (!hasAnswered) {
                    handleSubmit();
                } else {
                    handleNext();
                }
            }
        }}
        disabled={hasAnswered}
        autoComplete="off"
        style={{ opacity: 0, position: 'absolute', top: -1000, pointerEvents: 'none' }}
      />

      <div className="flex items-center justify-between mb-6">
        <Button icon={<ArrowLeft size={16} />} onClick={onBack}>
          Exit Mode
        </Button>
        <Text className="text-white text-lg font-semibold">
          {completedCount} / {totalQuestions}
        </Text>
      </div>


      <div className="bg-white/10 p-8 sm:p-12 rounded-3xl w-full text-center text-white border border-white/20 shadow-xl backdrop-blur-md" onClick={handleFocus}>
        <Title level={4} style={{ color: 'white', marginBottom: '24px' }}>
          {currentQuestion.reaction.name}
        </Title>

        {isNonFormulaType ? (
          <div className="bg-black/30 py-6 px-4 rounded-xl mb-8 overflow-x-auto">
            <div className="text-2xl sm:text-3xl text-yellow-300">
              <BlockMath>{currentQuestion.prefix}</BlockMath>
            </div>
            <div className="mt-6 flex justify-center">
              {renderMissingCharacters()}
            </div>
          </div>
        ) : (
          <div className="bg-black/30 py-6 px-4 rounded-xl mb-8 flex flex-wrap items-center justify-center gap-y-4">
            {currentQuestion.prefix && (
              <span className="text-2xl sm:text-3xl text-yellow-300"><InlineMath math={currentQuestion.prefix} /></span>
            )}
            
            {renderMissingCharacters()}
            
            {currentQuestion.suffix && (
              <span className="text-2xl sm:text-3xl text-yellow-300"><InlineMath math={currentQuestion.suffix} /></span>
            )}
          </div>
        )}

        {!hasAnswered ? (
          <div className="flex justify-center mt-6">
            <Button size="large" type="primary" onClick={(e) => { e.stopPropagation(); handleSubmit(); }} className="px-12 h-12 text-lg">
              Check
            </Button>
          </div>
        ) : (
          <div className="animate-fade-in flex flex-col items-center mt-6">
            {isCorrect ? (
              <div className="flex flex-col items-center text-green-400 mb-4 gap-2">
                
              </div>
            ) : (
              <div className="flex flex-col items-center text-red-400 mb-4 gap-2">
                
                <div className="text-xl sm:text-2xl text-yellow-300 bg-black/30 py-3 px-4 rounded-lg mt-2 w-full overflow-x-auto">
                   <BlockMath>{currentQuestion.reaction.formula}</BlockMath>
                </div>
              </div>
            )}
            <Button size="large" type="primary" onClick={(e) => { e.stopPropagation(); handleNext(); }} className="mt-4 px-12 h-12 text-lg">
              {queue.length > 0 ? 'Next Question' : 'Finish Session'}
            </Button>
          </div>
        )}
      </div>
      
      
    </div>
  );
};

export default MissingSession;