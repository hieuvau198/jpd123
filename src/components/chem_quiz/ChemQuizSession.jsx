import React, { useState, useEffect } from 'react';
import { Button, Typography, Flex, Alert } from 'antd';
import { CheckCircle, XCircle, ArrowRight } from 'lucide-react';
import 'katex/dist/katex.min.css';
import { BlockMath, InlineMath } from 'react-katex';
import SessionResult from '../SessionResult';

const { Title, Text } = Typography;

const ChemQuizSession = ({ data, onHome, initialNumbers, practiceId }) => {
  const [queue, setQueue] = useState([]);
  const [score, setScore] = useState(0);
  const [totalAttempted, setTotalAttempted] = useState(0);
  const [finished, setFinished] = useState(false);
  
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [isAnswered, setIsAnswered] = useState(false);

  useEffect(() => {
    // Initialize the queue and shuffle questions randomly
    const questions = Array.isArray(data) ? data.flatMap(d => d.questions) : (data.questions || []);
    const shuffledQuestions = [...questions].sort(() => 0.5 - Math.random());
    const initialQuestions = initialNumbers ? shuffledQuestions.slice(0, initialNumbers) : shuffledQuestions;
    
    setQueue(initialQuestions);
    setTotalAttempted(initialQuestions.length);
  }, [data, initialNumbers]);

  const renderMixedText = (text) => {
    if (!text || typeof text !== 'string') return text;
    
    const mathParts = text.split(/\$(.*?)\$/g);
    
    return mathParts.map((part, index) => {
      if (index % 2 === 1) {
        return <InlineMath key={index} math={part} />;
      }
      
      if (part.includes('\n')) {
        return part.split('\n').map((line, lineIdx, array) => (
          <React.Fragment key={`${index}-${lineIdx}`}>
            {line}
            {lineIdx < array.length - 1 && <br />}
          </React.Fragment>
        ));
      }
      
      return <span key={index}>{part}</span>;
    });
  };

  const currentQuestion = queue[0];
  const correctAnswer = currentQuestion?.correctAnswer || currentQuestion?.answer;

  const handleSelectAnswer = (opt) => {
    if (isAnswered) return; 
    setSelectedAnswer(opt);
    setIsAnswered(true);
  };

  const handleNext = () => {
    const isCorrect = String(selectedAnswer).trim() === String(correctAnswer).trim();
    let newQueue = [...queue];
    const answeredQuestion = newQueue.shift();

    if (!isCorrect) {
      const firstInsertIndex = Math.min(3, newQueue.length);
      newQueue.splice(firstInsertIndex, 0, { ...answeredQuestion, _isRetry: true });
      
      const secondInsertIndex = Math.min(6, newQueue.length);
      newQueue.splice(secondInsertIndex, 0, { ...answeredQuestion, _isRetry: true });
    } else {
      if (!answeredQuestion._isRetry) {
        setScore(prev => prev + 1); 
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
    const shuffledQuestions = [...questions].sort(() => 0.5 - Math.random());
    const initialQs = initialNumbers ? shuffledQuestions.slice(0, initialNumbers) : shuffledQuestions;
    
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
        {currentQuestion.svgCode && (
  <div 
    className="flex justify-center my-4"
    dangerouslySetInnerHTML={{ __html: currentQuestion.svgCode }} 
  />
)}
      </div>

      <Flex vertical gap="middle">
        {currentQuestion.options?.map((opt, idx) => {
          // ADDED: whiteSpace, wordBreak, and slightly adjusted padding for multiline text
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
              {/* ADDED: gap: '12px' so the text and icon don't touch */}
              <Flex justify="space-between" align="center" style={{ width: '100%', gap: '12px' }}>
                 {/* ADDED: flex: 1 so text takes up the remaining space properly */}
                 <span style={{ flex: 1, textAlign: 'left' }}>{renderMixedText(opt)}</span>
                 
                 {/* ADDED: flexShrink: 0 to icons to ensure they don't get squished by long text */}
                 {isAnswered && String(opt).trim() === String(correctAnswer).trim() && (
                    <CheckCircle size={20} style={{ flexShrink: 0 }} />
                 )}
                 {isAnswered && String(opt).trim() === String(selectedAnswer).trim() && String(opt).trim() !== String(correctAnswer).trim() && (
                    <XCircle size={20} style={{ flexShrink: 0 }} />
                 )}
              </Flex>
            </Button>
          );
        })}
      </Flex>

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