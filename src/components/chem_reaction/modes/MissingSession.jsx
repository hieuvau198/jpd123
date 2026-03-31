import React, { useState, useEffect, useRef } from 'react';
import { Button, Typography, message } from 'antd';
import { ArrowLeft } from 'lucide-react';
import { BlockMath, InlineMath } from 'react-katex';
import 'katex/dist/katex.min.css';
import SessionResult from '../../SessionResult';

const { Title, Text } = Typography;

// Safe wrapper for KaTeX BlockMath
const SafeBlockMath = ({ math }) => {
  if (!math) return null;
  let safeMath = math.toString();
  if (safeMath.trim().startsWith('_') || safeMath.trim().startsWith('^')) {
    safeMath = '{}' + safeMath;
  }
  if (safeMath.trim().endsWith('_') || safeMath.trim().endsWith('^')) {
    safeMath = safeMath + '{}';
  }
  return (
    <BlockMath 
      math={safeMath} 
      renderError={(error) => <span className="text-red-400 font-mono whitespace-pre-wrap">{math}</span>}
    />
  );
};

// Safe wrapper for KaTeX InlineMath
const SafeInlineMath = ({ math }) => {
  if (!math) return null;
  let safeMath = math.toString();
  if (safeMath.trim().startsWith('_') || safeMath.trim().startsWith('^')) {
    safeMath = '{}' + safeMath;
  }
  if (safeMath.trim().endsWith('_') || safeMath.trim().endsWith('^')) {
    safeMath = safeMath + '{}';
  }
  return (
    <InlineMath 
      math={safeMath} 
      renderError={(error) => <span className="text-red-400 font-mono whitespace-pre-wrap">{math}</span>}
    />
  );
};

const generateQuestions = (data) => {
  if (!data?.reactions || data.reactions.length === 0) return [];
  
  const shuffled = [...data.reactions].sort(() => 0.5 - Math.random());

  return shuffled.map(reaction => {
      let type = Math.random() > 0.5 ? 'coefficient' : 'element';
      let segments = [];
      let inputs = [];
      let success = false;
      let questionText = "";

      // Protect contents inside specific LaTeX commands to prevent unclosed brace parse errors
      // e.g. prevents matching 'C' inside \xrightarrow{t^o < 250^oC}
      const ignoredRanges = [];
      const ignoreBlocks = /\\(?:xrightarrow|xleftarrow|text|math[a-zA-Z]*)\s*\{[^}]*\}/g;
      let matchBlock;
      while ((matchBlock = ignoreBlocks.exec(reaction.formula)) !== null) {
          ignoredRanges.push({ start: matchBlock.index, end: matchBlock.index + matchBlock[0].length });
      }
      const cmdRegex = /\\[a-zA-Z]+/g;
      while ((matchBlock = cmdRegex.exec(reaction.formula)) !== null) {
          ignoredRanges.push({ start: matchBlock.index, end: matchBlock.index + matchBlock[0].length });
      }

      if (type === 'coefficient') {
          const regex = /(?:^|\s|\+|\\rightarrow|\\xrightarrow\{[^}]*\}|\\rightleftharpoons)\s*(\d+)(?=[A-Z\\])/g;
          const allMatches = [...reaction.formula.matchAll(regex)];
          
          const validMatches = allMatches.filter(match => {
              const numStr = match[1];
              const numIndex = match.index + match[0].lastIndexOf(numStr);
              // Ensure the number is not inside an ignored block (like temperature)
              return !ignoredRanges.some(range => numIndex >= range.start && numIndex < range.end);
          });
          
          if (validMatches.length > 0) {
              questionText = `Fill in all missing coefficients:`;
              let lastIndex = 0;
              
              validMatches.forEach(match => {
                  const numStr = match[1];
                  const matchStart = match.index + match[0].lastIndexOf(numStr);
                  
                  if (matchStart > lastIndex) {
                      segments.push({ isInput: false, text: reaction.formula.substring(lastIndex, matchStart) });
                  }
                  segments.push({ isInput: true, answer: numStr });
                  inputs.push(numStr);
                  lastIndex = matchStart + numStr.length;
              });
              
              if (lastIndex < reaction.formula.length) {
                  segments.push({ isInput: false, text: reaction.formula.substring(lastIndex) });
              }
              success = true;
          }
      } 
      
      // Fallback or explicit element choice
      if (type === 'element' || !success) {
          const elRegex = /[A-Z][a-z]?/g;
          const allMatches = [...reaction.formula.matchAll(elRegex)];
          
          const validMatches = allMatches.filter(match => {
              // Ensure the element is part of the actual chemical formula
              return !ignoredRanges.some(range => match.index >= range.start && match.index < range.end);
          });
          
          if (validMatches.length > 0) {
              // Calculate compound count to limit missing elements
              const parts = reaction.formula.split(/\+|\s=\s|\\(?:rightarrow|rightleftharpoons)|\\x(?:right|left)arrow(?:\{[^}]*\})?/);
              const compoundCount = parts.filter(p => p.trim().length > 0).length;
              
              // Only allow missing up to half the compounds
              const maxMissing = Math.max(1, Math.floor(compoundCount / 2));
              const numToMiss = Math.min(maxMissing, validMatches.length);
              
              const shuffledMatches = validMatches.sort(() => 0.5 - Math.random()).slice(0, numToMiss).sort((a, b) => a.index - b.index);
              
              questionText = `Fill in the missing elements:`;
              type = 'element';
              let lastIndex = 0;
              
              shuffledMatches.forEach(match => {
                  if (match.index > lastIndex) {
                      segments.push({ isInput: false, text: reaction.formula.substring(lastIndex, match.index) });
                  }
                  segments.push({ isInput: true, answer: match[0] });
                  inputs.push(match[0]);
                  lastIndex = match.index + match[0].length;
              });
              
              if (lastIndex < reaction.formula.length) {
                  segments.push({ isInput: false, text: reaction.formula.substring(lastIndex) });
              }
              success = true;
          }
      }

      if (!success) {
          return null; 
      }

      return {
          id: Math.random().toString(36).substr(2, 9),
          reaction,
          type,
          questionText,
          segments,
          answers: inputs,
          correctCountNeeded: 1 
      };
  }).filter(q => q !== null);
};

const MissingSession = ({ data, onBack }) => {
  const [queue, setQueue] = useState([]);
  const [totalQuestions, setTotalQuestions] = useState(0);
  const [completedCount, setCompletedCount] = useState(0);
  
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [inputValues, setInputValues] = useState([]);
  const [hasAnswered, setHasAnswered] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [isFinished, setIsFinished] = useState(false);

  const inputRefs = useRef([]);
  const handleNextRef = useRef(null);

  // Initialize questions immediately (skipping config screen)
  useEffect(() => {
    if (data) {
      const initialQuestions = generateQuestions(data);
      if (initialQuestions.length === 0) {
        message.warning('Could not generate suitable questions. Please check your data source.');
        onBack();
        return;
      }
      setQueue(initialQuestions);
      setTotalQuestions(initialQuestions.length);
      setCurrentQuestion(initialQuestions[0]);
    }
  }, [data, onBack]);

  // Reset inputs when the question changes
  useEffect(() => {
    if (currentQuestion) {
      setInputValues(currentQuestion.answers.map(() => ''));
      inputRefs.current = new Array(currentQuestion.answers.length).fill(null);
      setTimeout(() => {
        if (inputRefs.current[0]) inputRefs.current[0].focus();
      }, 100);
    }
  }, [currentQuestion]);

  const handleSubmit = () => {
    const isAnyEmpty = inputValues.some(val => !val || !val.trim());
    if (isAnyEmpty) {
      message.warning('Please fill in all missing parts!');
      return;
    }

    const allCorrect = currentQuestion.answers.every((ans, idx) => {
      const normalizedUser = (inputValues[idx] || '').replace(/\s+/g, '').toLowerCase();
      const normalizedAnswer = ans.toString().replace(/[_\{\}\^\s]+/g, '').toLowerCase();
      return normalizedUser === normalizedAnswer;
    });

    setIsCorrect(allCorrect);
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
      setHasAnswered(false);
      setIsCorrect(false);
    }
  };

  useEffect(() => {
    handleNextRef.current = handleNext;
  });

  useEffect(() => {
    if (hasAnswered && isCorrect) {
      const timer = setTimeout(() => {
        if (handleNextRef.current) {
          handleNextRef.current();
        }
      }, 800); 
      return () => clearTimeout(timer);
    }
  }, [hasAnswered, isCorrect]);

  const handleRestart = () => {
    const initialQuestions = generateQuestions(data);
    setQueue(initialQuestions);
    setTotalQuestions(initialQuestions.length);
    setCurrentQuestion(initialQuestions[0]);
    setCompletedCount(0);
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

  const renderMissingCharacters = (inputIdx, answer) => {
    const displayAnswer = answer.toString().replace(/[_\{\}\^]/g, '');
    const chars = displayAnswer.split('');
    const currentVal = inputValues[inputIdx] || '';
    const isThisInputCorrect = currentVal.replace(/\s+/g, '').toLowerCase() === displayAnswer.toLowerCase();

    return (
      <div key={`input-wrap-${inputIdx}`} className="relative flex items-center gap-1 mx-2" onClick={() => inputRefs.current[inputIdx]?.focus()} style={{ cursor: 'text' }}>
        <input
          ref={el => inputRefs.current[inputIdx] = el}
          type="text"
          value={currentVal}
          onChange={(e) => {
              if (hasAnswered) return;
              const val = e.target.value;
              if (val.length <= displayAnswer.length) {
                  const newValues = [...inputValues];
                  newValues[inputIdx] = val;
                  setInputValues(newValues);

                  // Auto advance focus to next input if filled
                  if (val.length === displayAnswer.length && inputIdx < currentQuestion.answers.length - 1) {
                      inputRefs.current[inputIdx + 1]?.focus();
                  }
              }
          }}
          onKeyDown={(e) => {
              if (e.key === 'Enter') {
                  if (!hasAnswered) handleSubmit();
                  else if (!isCorrect) handleNext();
              } else if (e.key === 'Backspace' && currentVal === '' && inputIdx > 0) {
                  // Fallback to previous input on backspace when empty
                  inputRefs.current[inputIdx - 1]?.focus();
              }
          }}
          disabled={hasAnswered}
          autoComplete="off"
          className="absolute inset-0 opacity-0 cursor-text w-full h-full"
        />

        {chars.map((char, charIdx) => {
          const userChar = currentVal[charIdx] || "";
          
          let color = '#fde047'; 
          if (hasAnswered) {
             if (isThisInputCorrect) color = '#4ade80'; 
             else color = '#f87171'; 
          }

          return (
            <div key={charIdx} className="flex flex-col items-center justify-end pointer-events-none" style={{ width: '32px', height: '44px' }}>
              <Text style={{ 
                  fontSize: '32px',
                  color: userChar || (hasAnswered && !isThisInputCorrect) ? color : '#9ca3af',
                  fontWeight: 'bold',
                  lineHeight: '1',
                  fontFamily: 'monospace'
              }}>
                  {(hasAnswered && !isThisInputCorrect) ? char : (userChar || "_")}
              </Text>
              <div style={{ 
                  width: '100%', 
                  height: '4px', 
                  background: userChar || (hasAnswered && !isThisInputCorrect) ? color : '#9ca3af',
                  borderRadius: '2px',
                  marginTop: '6px'
              }} />
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="mt-12 min-h-screen p-4 sm:p-8 max-w-3xl mx-auto flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <Button icon={<ArrowLeft size={16} />} onClick={onBack}>
          Exit
        </Button>
        <Text className="text-white text-lg font-semibold">
          {completedCount} / {totalQuestions}
        </Text>
      </div>

      <div className="bg-white/10 p-8 sm:p-12 rounded-3xl w-full text-center text-white border border-white/20 shadow-xl backdrop-blur-md">
        <Title level={4} style={{ color: 'white', marginBottom: '24px' }}>
          {currentQuestion.questionText}
        </Title>

        <div className="bg-black/30 py-6 px-4 rounded-xl mb-8 flex flex-wrap items-center justify-center gap-y-4">
          {currentQuestion.segments.map((seg, idx) => {
            if (!seg.isInput) {
              return (
                <span key={`text-${idx}`} className="text-2xl sm:text-3xl text-yellow-300">
                  <SafeInlineMath math={seg.text} />
                </span>
              );
            } else {
              // Calculate which answer index this corresponds to
              const inputIdx = currentQuestion.segments.slice(0, idx).filter(s => s.isInput).length;
              return renderMissingCharacters(inputIdx, seg.answer);
            }
          })}
        </div>

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
                 <span className="text-xl font-semibold">Correct! Moving to next...</span>
              </div>
            ) : (
              <div className="flex flex-col items-center text-red-400 mb-4 gap-2">
                <div className="text-xl sm:text-2xl text-yellow-300 bg-black/30 py-3 px-4 rounded-lg mt-2 w-full overflow-x-auto">
                   <SafeBlockMath math={currentQuestion.reaction.formula} />
                </div>
              </div>
            )}
            {!isCorrect && (
              <Button size="large" type="primary" onClick={(e) => { e.stopPropagation(); handleNext(); }} className="mt-4 px-12 h-12 text-lg">
                {queue.length > 0 ? 'Next Question' : 'Finish Session'}
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default MissingSession;