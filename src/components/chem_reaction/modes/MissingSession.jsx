import React, { useState, useEffect, useMemo } from 'react';
import { Button, Input, Typography, Progress, Card, Space, message } from 'antd';
import { ArrowLeft, CheckCircle, XCircle } from 'lucide-react';
import { BlockMath } from 'react-katex';
import 'katex/dist/katex.min.css';
import SessionResult from '../../SessionResult';

const { Title, Text } = Typography;

const generateQuestions = (data) => {
  if (!data?.reactions || data.reactions.length === 0) return [];
  
  // Mix reactions randomly
  const shuffled = [...data.reactions].sort(() => 0.5 - Math.random());
  const types = ['element', 'compound', 'coefficient', 'subscript', 'valency'];

  return shuffled.map(reaction => {
      let latexDisplay = reaction.formula;
      let answer = "";
      let questionText = "";
      let success = false;
      let chosenType = '';

      // Shuffle types to try them randomly until one works for this specific formula
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
                  success = true;
              }
          } else if (t === 'subscript') {
              // Match subscript digits e.g. _2 or _{3}
              const regex = /_(\d|\{\d+\})/g;
              const matches = [...latexDisplay.matchAll(regex)];
              if (matches.length > 0) {
                  const match = matches[Math.floor(Math.random() * matches.length)];
                  answer = match[1].replace(/[{}]/g, '');
                  latexDisplay = latexDisplay.substring(0, match.index) + '_\\square' + latexDisplay.substring(match.index + match[0].length);
                  questionText = `Fill in the missing subscript:`;
                  chosenType = 'subscript';
                  success = true;
              }
          } else if (t === 'coefficient') {
              // Match leading numbers before elements, usually following start, plus, or arrows
              const regex = /(?:^|\s|\+|\\rightarrow|\\xrightarrow\{[^}]*\})\s*(\d+)(?=[A-Z])/g;
              const matches = [...latexDisplay.matchAll(regex)];
              if (matches.length > 0) {
                  const match = matches[Math.floor(Math.random() * matches.length)];
                  answer = match[1];
                  const indexOfDigit = match[0].lastIndexOf(match[1]);
                  const globalIndex = match.index + indexOfDigit;
                  latexDisplay = latexDisplay.substring(0, globalIndex) + '\\square ' + latexDisplay.substring(globalIndex + match[1].length);
                  questionText = `Fill in the missing coefficient:`;
                  chosenType = 'coefficient';
                  success = true;
              }
          } else if (t === 'element') {
              // Pick an element from the valency dict and replace its occurrence
              const elements = Object.keys(reaction.valency || {});
              if (elements.length > 0) {
                  const el = elements[Math.floor(Math.random() * elements.length)];
                  const regex = new RegExp(`${el}(?![a-z])`);
                  const match = latexDisplay.match(regex);
                  if (match) {
                      answer = el;
                      latexDisplay = latexDisplay.replace(regex, '\\square ');
                      questionText = `Fill in the missing element:`;
                      chosenType = 'element';
                      success = true;
                  }
              }
          } else if (t === 'compound') {
              // Split reaction by standard LaTeX operators to extract compounds
              const parts = latexDisplay.split(/(?:\+|\\rightarrow|\\xrightarrow\{.*?\})/);
              const compounds = parts.map(p => p.replace(/\\uparrow/g, '').replace(/\\downarrow/g, '').trim()).filter(p => p.length > 0 && p !== '\\Delta');
              if (compounds.length > 0) {
                  const selected = compounds[Math.floor(Math.random() * compounds.length)];
                  answer = selected;
                  const escapeRegExp = (string) => string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                  latexDisplay = latexDisplay.replace(new RegExp(escapeRegExp(selected)), '\\square');
                  questionText = `Fill in the missing compound:`;
                  chosenType = 'compound';
                  success = true;
              }
          }
      }

      // Absolute fallback if parsing fails to find anything removable
      if (!success) {
          chosenType = 'valency'; 
          questionText = `What is the condition for this reaction?`;
          answer = reaction.condition || "none";
          latexDisplay = reaction.formula;
      }

      return {
          reaction,
          type: chosenType,
          questionText,
          latexDisplay,
          answer: answer.toString().trim()
      };
  });
};

const MissingSession = ({ data, onBack }) => {
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userAnswer, setUserAnswer] = useState('');
  const [hasAnswered, setHasAnswered] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [isFinished, setIsFinished] = useState(false);

  useEffect(() => {
    if (data) {
      setQuestions(generateQuestions(data));
    }
  }, [data]);

  const currentQuestion = questions[currentIndex];
  const progressPercent = Math.round((currentIndex / questions.length) * 100) || 0;

  const handleSubmit = () => {
    if (!userAnswer.trim()) {
      message.warning('Please enter an answer!');
      return;
    }

    // Normalize strings for flexible matching (ignore spaces & exact case for compounds)
    const normalizedUser = userAnswer.replace(/\s+/g, '').toLowerCase();
    const normalizedAnswer = currentQuestion.answer.replace(/\s+/g, '').toLowerCase();

    const correct = normalizedUser === normalizedAnswer;
    setIsCorrect(correct);
    if (correct) {
      setCorrectCount(prev => prev + 1);
    }
    setHasAnswered(true);
  };

  const handleNext = () => {
    setUserAnswer('');
    setHasAnswered(false);
    setIsCorrect(false);

    if (currentIndex + 1 < questions.length) {
      setCurrentIndex(prev => prev + 1);
    } else {
      setIsFinished(true);
    }
  };

  const handleRestart = () => {
    setQuestions(generateQuestions(data));
    setCurrentIndex(0);
    setCorrectCount(0);
    setUserAnswer('');
    setHasAnswered(false);
    setIsCorrect(false);
    setIsFinished(false);
  };

  if (isFinished) {
    const finalScore = Math.round((correctCount / questions.length) * 100);
    return (
      <SessionResult 
        score={finalScore} 
        onBack={onBack} 
        onRestart={handleRestart} 
        practiceId={data?.id}
        practiceType="Chem Reaction"
        resultMessage={`You answered ${correctCount} out of ${questions.length} missing parts correctly!`}
      />
    );
  }

  if (!questions.length) return <div className="p-8 text-center text-white">Loading questions...</div>;

  return (
    <div className="min-h-screen p-4 sm:p-8 max-w-3xl mx-auto flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <Button icon={<ArrowLeft size={16} />} onClick={onBack}>
          Exit Mode
        </Button>
        <Text className="text-white text-lg font-semibold">
          Score: {correctCount} / {questions.length}
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
        <Text className="text-white/70 block mb-2 uppercase tracking-widest text-sm">
          Question {currentIndex + 1} of {questions.length}
        </Text>
        
        <Title level={4} style={{ color: 'white', marginBottom: '24px' }}>
          {currentQuestion.reaction.name}
        </Title>

        {/* Reaction Display with KaTeX */}
        <div className="bg-black/30 py-6 px-4 rounded-xl mb-8 overflow-x-auto">
          <div className="text-2xl sm:text-3xl text-yellow-300">
            <BlockMath>{currentQuestion.latexDisplay}</BlockMath>
          </div>
        </div>

        <Text className="block text-xl mb-6 text-blue-200">
          {currentQuestion.questionText}
        </Text>

        {!hasAnswered ? (
          <Space.Compact style={{ width: '100%', maxWidth: '400px' }}>
            <Input 
              size="large"
              autoFocus
              value={userAnswer}
              onChange={(e) => setUserAnswer(e.target.value)}
              onPressEnter={handleSubmit}
              placeholder="Type your answer here..."
              style={{ textAlign: 'center', fontSize: '18px' }}
            />
            <Button size="large" type="primary" onClick={handleSubmit}>
              Check
            </Button>
          </Space.Compact>
        ) : (
          <div className="animate-fade-in flex flex-col items-center">
            {isCorrect ? (
              <div className="flex items-center text-green-400 mb-4 gap-2 text-2xl font-bold">
                <CheckCircle size={32} /> Correct!
              </div>
            ) : (
              <div className="flex flex-col items-center text-red-400 mb-4 gap-2">
                <div className="flex items-center gap-2 text-2xl font-bold mb-2">
                  <XCircle size={32} /> Incorrect!
                </div>
                <Text className="text-white text-lg">
                  The correct answer was: <span className="text-yellow-300 font-bold">{currentQuestion.answer}</span>
                </Text>
              </div>
            )}
            <Button size="large" type="primary" onClick={handleNext} className="mt-4 px-12 h-12 text-lg">
              {currentIndex + 1 < questions.length ? 'Next Question' : 'Finish Session'}
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