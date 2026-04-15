import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Home, ArrowRight } from 'lucide-react';
import { Button, Typography, Flex, Alert } from 'antd';
import SessionResult from './SessionResult';

const { Title, Text } = Typography;

const shuffleArray = (array) => {
  const newArr = [...array];
  for (let i = newArr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArr[i], newArr[j]] = [newArr[j], newArr[i]];
  }
  return newArr;
};

const prepareSessionData = (originalData, limit = null) => {
  const rawQuestions = Array.isArray(originalData) 
    ? originalData.flatMap(d => d.questions) 
    : (originalData.questions || []);
  if (rawQuestions.length === 0) return [];
  
  let shuffledQuestions = shuffleArray(rawQuestions);
  
  if (limit && limit > 0 && limit < shuffledQuestions.length) {
    shuffledQuestions = shuffledQuestions.slice(0, limit);
  }

  return shuffledQuestions.map(q => ({
    ...q,
    correctAnswer: q.correctAnswer || q.answer, 
    options: shuffleArray(q.options)
  }));
};

const QuizSession = ({ data, onHome, initialNumbers }) => {
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0); 
  const [isFinished, setIsFinished] = useState(false);
  const [selectedOption, setSelectedOption] = useState(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [totalQuestions, setTotalQuestions] = useState(0);

  useEffect(() => {
    const prepped = prepareSessionData(data, initialNumbers);
    setQuestions(prepped);
    setTotalQuestions(prepped.length);
  }, [data, initialNumbers]);

  const currentQuestion = questions[currentIndex];
  const correctAnswer = currentQuestion?.correctAnswer;

  const renderFormattedText = (text) => {
    if (typeof text !== 'string') return text;
    const parts = text.split(/\*\*(.*?)\*\*/g);
    return parts.map((part, index) => {
      const processNewLines = (str) => {
        return str.split('\n').map((line, i, arr) => (
          <React.Fragment key={i}>
            {line}
            {i < arr.length - 1 && <br />}
          </React.Fragment>
        ));
      };
      if (index % 2 === 1) return <u key={index}>{processNewLines(part)}</u>;
      return <React.Fragment key={index}>{processNewLines(part)}</React.Fragment>;
    });
  };

  const handleOptionClick = (option) => {
    if (isAnswered) return; 
    setSelectedOption(option);
    setIsAnswered(true);
  };

  const handleNext = () => {
    const isCorrect = String(selectedOption).trim() === String(correctAnswer).trim();
    
    if (isCorrect) {
      if (!currentQuestion._retry) {
        setScore(prev => prev + 1);
      }
      moveNext();
    } else {
      // Add to end for retry if wrong, matching logic from original but keeping session flow
      const retryQuestion = { ...currentQuestion, _retry: true };
      setQuestions(prev => [...prev, retryQuestion]);
      moveNext();
    }
  };

  const moveNext = () => {
    if (currentIndex + 1 < questions.length) {
      setCurrentIndex(prev => prev + 1);
      setSelectedOption(null);
      setIsAnswered(false);
    } else {
      setIsFinished(true);
    }
  };

  const restart = () => {
    const prepped = prepareSessionData(data, initialNumbers);
    setQuestions(prepped);
    setTotalQuestions(prepped.length);
    setCurrentIndex(0);
    setScore(0);
    setIsFinished(false);
    setSelectedOption(null);
    setIsAnswered(false);
  };

  if (isFinished) {
    const finalScore = Math.round((score / totalQuestions) * 100) || 0;
    return (
      <SessionResult
        score={finalScore}
        onBack={onHome}
        onRestart={restart}
        practiceId={data.id}      
        practiceType="Quiz"           
        backText="Home"
        restartText="Restart"
        resultMessage={`You answered ${score} out of ${totalQuestions} correctly on the first try!`}
      />
    );
  }

  if (!currentQuestion) return null;

  return (
    <div className="max-w-3xl mx-4 sm:mx-auto p-4 sm:p-8 mt-20 bg-white rounded-xl shadow-md pb-24">
      <div className="flex justify-between items-center mb-6">
         <Button type="text" icon={<Home size={16} />} onClick={onHome}>EXIT</Button>
         <span className="text-gray-500 font-medium">{currentIndex + 1} / {questions.length}</span>
      </div>
      
      {/* EXPLANATION MOVED HERE AND CONDITION UPDATED */}
      {isAnswered && currentQuestion.explanation && (
        <Alert
          message="Insight"
          description={<div className="text-base">{renderFormattedText(currentQuestion.explanation)}</div>}
          type="info"
          showIcon
          className="mb-6"
        />
      )}

      <div className="mb-8 p-6 border border-gray-100 rounded-lg bg-gray-50">
        <Title level={4} style={{ marginTop: 0 }}>
           {currentQuestion._retry && <Text type="danger" style={{marginRight: 8}}>[Retry]</Text>}
           {renderFormattedText(currentQuestion.question)}
        </Title>
        
        {/* SVG Support added here */}
        {currentQuestion.svgCode && (
          <div 
            className="flex justify-center my-4"
            dangerouslySetInnerHTML={{ __html: currentQuestion.svgCode }} 
          />
        )}
      </div>

      <Flex vertical gap="middle">
        {currentQuestion.options.map((option, idx) => {
          let buttonStyle = { 
            height: 'auto', 
            padding: '16px 20px', 
            textAlign: 'left', 
            justifyContent: 'flex-start', 
            fontSize: '1.1rem',
            whiteSpace: 'normal', 
            wordBreak: 'break-word'
          };
          
          if (isAnswered) {
            const isThisCorrect = String(option).trim() === String(correctAnswer).trim();
            const isThisSelected = String(option).trim() === String(selectedOption).trim();
            
            // Styled like ChemQuiz: Green for correct, Red for wrong
            if (isThisCorrect) {
              buttonStyle = { ...buttonStyle, backgroundColor: '#52c41a', color: 'white', borderColor: '#52c41a' };
            } else if (isThisSelected && !isThisCorrect) {
              buttonStyle = { ...buttonStyle, backgroundColor: '#ff4d4f', color: 'white', borderColor: '#ff4d4f' };
            }
          }

          return (
            <Button 
              key={idx} 
              size="large" 
              block 
              style={buttonStyle}
              onClick={() => handleOptionClick(option)}
              disabled={isAnswered}
            >
              <Flex justify="space-between" align="center" style={{ width: '100%', gap: '12px' }}>
                 <span style={{ flex: 1, textAlign: 'left' }}>{renderFormattedText(option)}</span>
                 
                 {isAnswered && String(option).trim() === String(correctAnswer).trim() && (
                    <CheckCircle size={20} style={{ flexShrink: 0 }} />
                 )}
                 {isAnswered && String(option).trim() === String(selectedOption).trim() && String(option).trim() !== String(correctAnswer).trim() && (
                    <XCircle size={20} style={{ flexShrink: 0 }} />
                 )}
              </Flex>
            </Button>
          );
        })}
      </Flex>

      {/* BOTTOM SECTION WITH ONLY THE NEXT BUTTON */}
      {isAnswered && (
        <div className="mt-6">
          <Flex justify="end">
            <Button 
              type="primary" 
              size="large" 
              icon={<ArrowRight size={18} />} 
              onClick={handleNext}
              className="px-8 mt-4"
              style={{ background: 'black', border: 'none' }}
            >
              Next
            </Button>
          </Flex>
        </div>
      )}
    </div>
  );
};

export default QuizSession;