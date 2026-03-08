import React, { useState, useEffect } from 'react';
import { Button, Typography, Flex, Alert } from 'antd'; // Removed 'Result'
import { CheckCircle, XCircle, ArrowRight } from 'lucide-react';
import 'katex/dist/katex.min.css';
import { BlockMath, InlineMath } from 'react-katex';
import SessionResult from '../SessionResult'; // Import SessionResult

const { Title, Text } = Typography;

const ChemQuizSession = ({ data, onHome, initialNumbers, practiceId }) => {
  const [queue, setQueue] = useState([]);
  const [score, setScore] = useState(0);
  const [totalAttempted, setTotalAttempted] = useState(0); // Real original question count
  const [finished, setFinished] = useState(false);
  
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [isAnswered, setIsAnswered] = useState(false);

  useEffect(() => {
    // Initialize the queue
    const questions = Array.isArray(data) ? data.flatMap(d => d.questions) : (data.questions || []);
    const initialQuestions = initialNumbers ? questions.slice(0, initialNumbers) : questions;
    setQueue(initialQuestions);
    setTotalAttempted(initialQuestions.length);
  }, [data, initialNumbers]);

  const renderMixedText = (text) => {
    if (!text || typeof text !== 'string') return text;
    if (!text.includes('$')) return <span>{text}</span>;
    const parts = text.split(/\$(.*?)\$/g);
    return parts.map((part, index) => (
      index % 2 === 1 ? <InlineMath key={index} math={part} /> : <span key={index}>{part}</span>
    ));
  };

  const currentQuestion = queue[0];
  const correctAnswer = currentQuestion?.correctAnswer || currentQuestion?.answer;

  const handleSelectAnswer = (opt) => {
    if (isAnswered) return; // Prevent changing answer
    setSelectedAnswer(opt);
    setIsAnswered(true);
  };

  const handleNext = () => {
    const isCorrect = String(selectedAnswer).trim() === String(correctAnswer).trim();
    let newQueue = [...queue];
    const answeredQuestion = newQueue.shift();

    if (!isCorrect) {
      // Re-insert 2 times: after 3 questions and after 6 questions (or end of queue)
      const firstInsertIndex = Math.min(3, newQueue.length);
      newQueue.splice(firstInsertIndex, 0, { ...answeredQuestion, _isRetry: true });
      
      const secondInsertIndex = Math.min(6, newQueue.length);
      newQueue.splice(secondInsertIndex, 0, { ...answeredQuestion, _isRetry: true });
    } else {
      if (!answeredQuestion._isRetry) {
        setScore(prev => prev + 1); // Only score on first try
      }
    }

    setQueue(newQueue);
    setSelectedAnswer(null);
    setIsAnswered(false);

    if (newQueue.length === 0) {
      setFinished(true);
    }
  };

  const handleRestart = () => {
    const questions = Array.isArray(data) ? data.flatMap(d => d.questions) : (data.questions || []);
    const initialQs = initialNumbers ? questions.slice(0, initialNumbers) : questions;
    setQueue(initialQs);
    setTotalAttempted(initialQs.length);
    setScore(0);
    setFinished(false);
    setSelectedAnswer(null);
    setIsAnswered(false);
  };

  if (finished) {
    const finalScore = totalAttempted > 0 ? Math.round((score / totalAttempted) * 100) : 0;
    return (
      <SessionResult
        score={finalScore}
        onBack={onHome}
        onRestart={handleRestart}
        backText="Back to List"
        restartText="Try Again"
        resultMessage={`You answered ${score} out of ${totalAttempted} correctly on the first try!`}
        practiceId={practiceId}
        practiceType="Chem Quiz"
      />
    );
  }

  if (!currentQuestion) return null;

  return (
    <div className="max-w-3xl mx-4 sm:mx-auto p-4 sm:p-8 mt-20 bg-white rounded-xl shadow-md pb-24">
      <div className="flex justify-between items-center mb-6">
         <h2 className="text-xl font-bold text-gray-800">{data.title || 'Chemistry Quiz'}</h2>
         {/* Show remaining questions in queue */}
         <span className="text-gray-500 font-medium">{queue.length}</span>
      </div>
      
      <div className="mb-8 p-6 border border-gray-100 rounded-lg bg-gray-50">
        <Title level={4} style={{ marginTop: 0 }}>
           {currentQuestion._isRetry && <Text type="danger" style={{marginRight: 8}}>[Retry]</Text>}
           {renderMixedText(currentQuestion.text || currentQuestion.question)}
        </Title>
        
        {currentQuestion.formula && (
          <div style={{ margin: '20px 0', padding: '15px', background: '#e6f7ff', borderLeft: '4px solid #1890ff', borderRadius: '4px', textAlign: 'center', fontSize: '1.2rem' }}>
            <BlockMath math={currentQuestion.formula} />
          </div>
        )}
      </div>

      <Flex vertical gap="middle">
        {currentQuestion.options?.map((opt, idx) => {
          let buttonStyle = { height: 'auto', padding: '20px', textAlign: 'left', justifyContent: 'flex-start', fontSize: '1.1rem' };
          
          if (isAnswered) {
            const isThisCorrect = String(opt).trim() === String(correctAnswer).trim();
            const isThisSelected = String(opt).trim() === String(selectedAnswer).trim();
            
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
              onClick={() => handleSelectAnswer(opt)}
            >
              <Flex justify="space-between" align="center" style={{ width: '100%' }}>
                 <span>{renderMixedText(opt)}</span>
                 {isAnswered && String(opt).trim() === String(correctAnswer).trim() && <CheckCircle size={20} />}
                 {isAnswered && String(opt).trim() === String(selectedAnswer).trim() && String(opt).trim() !== String(correctAnswer).trim() && <XCircle size={20} />}
              </Flex>
            </Button>
          );
        })}
      </Flex>

      {/* Explanation and Next Button Area */}
      {isAnswered && (
        <div className="mt-6">
          {String(selectedAnswer).trim() !== String(correctAnswer).trim() && currentQuestion.explanation && (
            <Alert
              message="Explanation"
              description={<div className="text-base">{renderMixedText(currentQuestion.explanation)}</div>}
              type="info"
              showIcon
              className="mb-6"
            />
          )}
          
          <Flex justify="end">
            <Button 
              type="primary" 
              size="large" 
              icon={<ArrowRight size={18} />} 
              onClick={handleNext}
              className="px-8 mt-4"
            >
              Next
            </Button>
          </Flex>
        </div>
      )}
    </div>
  );
};

export default ChemQuizSession;