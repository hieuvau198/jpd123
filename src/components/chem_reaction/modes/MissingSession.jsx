import React, { useState, useEffect } from 'react';
import { Button, Input, Typography, Progress, Card, Space, message } from 'antd';
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
                  questionText = `What is the valency of ${el} in this reaction?`;
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
                  questionText = `Fill in the missing subscript:`;
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
                  questionText = `Fill in the missing coefficient:`;
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
                      questionText = `Fill in the missing element:`;
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
                      questionText = `Fill in the missing compound:`;
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
  const [userAnswer, setUserAnswer] = useState('');
  const [hasAnswered, setHasAnswered] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [isFinished, setIsFinished] = useState(false);

  useEffect(() => {
    if (data) {
      const initialQuestions = generateQuestions(data);
      setQueue(initialQuestions);
      setTotalQuestions(initialQuestions.length);
      setCurrentQuestion(initialQuestions[0]);
    }
  }, [data]);

  const progressPercent = Math.round((completedCount / totalQuestions) * 100) || 0;

  const handleSubmit = () => {
    if (!userAnswer.trim()) {
      message.warning('Please enter an answer!');
      return;
    }

    const normalizedUser = userAnswer.replace(/\s+/g, '').toLowerCase();
    const normalizedAnswer = currentQuestion.answer.replace(/\s+/g, '').toLowerCase();

    setIsCorrect(normalizedUser === normalizedAnswer);
    setHasAnswered(true);
  };

  const handleNext = () => {
    let newQueue = [...queue];
    const answeredQuestion = newQueue.shift();

    if (isCorrect) {
      answeredQuestion.correctCountNeeded -= 1;
      
      if (answeredQuestion.correctCountNeeded <= 0) {
        // Question fully mastered
        setCompletedCount(prev => prev + 1);
      } else {
        // Was previously wrong, needs one more correct answer. Reinsert.
        const insertIndex = Math.min(2, newQueue.length);
        newQueue.splice(insertIndex, 0, answeredQuestion);
      }
    } else {
      // Answered wrong! Set penalty to require 2 correct answers
      answeredQuestion.correctCountNeeded = 2;
      // Re-insert after at most 2 other questions
      const insertIndex = Math.min(2, newQueue.length);
      newQueue.splice(insertIndex, 0, answeredQuestion);
    }

    if (newQueue.length === 0) {
      setIsFinished(true);
    } else {
      setQueue(newQueue);
      setCurrentQuestion(newQueue[0]);
      setUserAnswer('');
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
    setUserAnswer('');
    setHasAnswered(false);
    setIsCorrect(false);
    setIsFinished(false);
  };

  // Determine styling for inline inputs
  const getInputStyles = () => {
    let base = "text-center font-bold bg-black/50 text-white border-2 border-dashed border-white/50 focus:border-yellow-300 focus:bg-black/80 hover:bg-black/60 transition-all mx-1 ";
    if (isCorrect && hasAnswered) base += "!border-green-400 !text-green-400 ";
    if (!isCorrect && hasAnswered) base += "!border-red-400 !text-red-400 ";

    switch(currentQuestion?.type) {
      case 'subscript': return base + "w-12 h-8 text-sm translate-y-3";
      case 'coefficient': return base + "w-14 h-12 text-xl";
      case 'element': return base + "w-16 h-12 text-xl";
      case 'compound': return base + "w-28 h-12 text-xl";
      default: return base + "w-20 h-12 text-xl";
    }
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

  return (
    <div className="min-h-screen p-4 sm:p-8 max-w-3xl mx-auto flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <Button icon={<ArrowLeft size={16} />} onClick={onBack}>
          Exit Mode
        </Button>
        <Text className="text-white text-lg font-semibold">
          Completed: {completedCount} / {totalQuestions}
        </Text>
      </div>

      <Progress 
        percent={progressPercent} 
        showInfo={false} 
        strokeColor="#52c41a" 
        trailColor="rgba(255,255,255,0.2)"
        className="mb-8"
      />

      <div className="bg-white/10 p-8 sm:p-12 rounded-3xl w-full text-center text-white border border-white/20 shadow-xl backdrop-blur-md">
        <Title level={4} style={{ color: 'white', marginBottom: '24px' }}>
          {currentQuestion.reaction.name}
        </Title>

        {isNonFormulaType ? (
          // Full equation display for valency/condition questions where inline doesn't make sense
          <div className="bg-black/30 py-6 px-4 rounded-xl mb-8 overflow-x-auto">
            <div className="text-2xl sm:text-3xl text-yellow-300">
              <BlockMath>{currentQuestion.prefix}</BlockMath>
            </div>
          </div>
        ) : (
          // Inline flex layout for missing formulas
          <div className="bg-black/30 py-6 px-4 rounded-xl mb-8 flex flex-wrap items-center justify-center gap-y-4">
            {currentQuestion.prefix && (
              <span className="text-2xl sm:text-3xl text-yellow-300"><InlineMath math={currentQuestion.prefix} /></span>
            )}
            
            <Input 
              autoFocus
              value={userAnswer}
              onChange={(e) => setUserAnswer(e.target.value)}
              onPressEnter={!hasAnswered ? handleSubmit : handleNext}
              className={getInputStyles()}
              disabled={hasAnswered}
            />
            
            {currentQuestion.suffix && (
              <span className="text-2xl sm:text-3xl text-yellow-300"><InlineMath math={currentQuestion.suffix} /></span>
            )}
          </div>
        )}

        <Text className="block text-xl mb-6 text-blue-200">
          {currentQuestion.questionText}
        </Text>

        {isNonFormulaType && !hasAnswered && (
          <Space.Compact style={{ width: '100%', maxWidth: '400px', marginBottom: '24px' }}>
            <Input 
              size="large"
              autoFocus
              value={userAnswer}
              onChange={(e) => setUserAnswer(e.target.value)}
              onPressEnter={handleSubmit}
              placeholder="Type your answer here..."
              style={{ textAlign: 'center', fontSize: '18px' }}
            />
          </Space.Compact>
        )}

        {!hasAnswered ? (
          <div className="flex justify-center">
            <Button size="large" type="primary" onClick={handleSubmit} className="px-12 h-12 text-lg">
              Check
            </Button>
          </div>
        ) : (
          <div className="animate-fade-in flex flex-col items-center">
            {isCorrect ? (
              <div className="flex flex-col items-center text-green-400 mb-4 gap-2">
                <div className="flex items-center gap-2 text-2xl font-bold">
                  <CheckCircle size={32} /> Correct!
                </div>
                {currentQuestion.correctCountNeeded === 0 ? (
                  <Text className="text-green-300">Question Mastered!</Text>
                ) : (
                  <Text className="text-yellow-300 text-sm">You need to answer this correctly {currentQuestion.correctCountNeeded} more time(s) to clear the penalty.</Text>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center text-red-400 mb-4 gap-2">
                <div className="flex items-center gap-2 text-2xl font-bold mb-2">
                  <XCircle size={32} /> Incorrect!
                </div>
                <Text className="text-white text-lg">
                  The correct answer was: <span className="text-yellow-300 font-bold">{currentQuestion.answer}</span>
                </Text>
                <Text className="text-red-300 text-sm">Penalty added! This question will return soon.</Text>
              </div>
            )}
            <Button size="large" type="primary" onClick={handleNext} className="mt-4 px-12 h-12 text-lg">
              {queue.length > 0 ? 'Next Question' : 'Finish Session'}
            </Button>
          </div>
        )}
      </div>
      
      {currentQuestion.reaction.description && (
        <Card className="mt-8 bg-white/5 border-white/10 text-white/80 backdrop-blur-sm">
          <Text className="text-blue-300 font-semibold block mb-2">Did you know?</Text>
          <Text className="text-white/80">{currentQuestion.reaction.description}</Text>
        </Card>
      )}
    </div>
  );
};

export default MissingSession;