// src/components/PhoneticSession.jsx
import React, { useState } from 'react';
import { Card, Button, Typography, Progress, Result, Alert } from 'antd';
import { Volume2, CheckCircle2, XCircle, ArrowRight, RotateCcw } from 'lucide-react';

const { Title, Text } = Typography;

// Helper function to randomly shuffle an array (Fisher-Yates algorithm)
const shuffleArray = (array) => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

const PhoneticSession = ({ data, onFinish }) => {
  // Initialize with shuffled questions and shuffled options
  const [questions, setQuestions] = useState(() => {
    if (!data || !data.questions) return [];
    
    // Deep copy, shuffle the questions, and shuffle options inside each question
    return shuffleArray(data.questions).map(q => ({
      ...q,
      options: shuffleArray(q.options)
    }));
  });
  
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);

  const currentQuestion = questions[currentIndex];
  const isFinished = currentIndex >= questions.length;

  const playAudio = (word, e) => {
    if (e) e.stopPropagation();
    const utterance = new SpeechSynthesisUtterance(word);
    utterance.lang = 'en-US'; // Adjust based on your subject if needed
    window.speechSynthesis.speak(utterance);
  };

  const handleSelectOption = (optionWord) => {
    if (isAnswered) return;
    
    setSelectedOption(optionWord);
    setIsAnswered(true);

    if (optionWord === currentQuestion.correctAnswer) {
      // We only count it as "correct" if it wasn't a recycled question
      // (A simple way: if currentIndex < original length)
      if (currentIndex < data.questions.length) {
         setCorrectCount(prev => prev + 1);
      }
    }
  };

  const handleNext = () => {
    if (selectedOption !== currentQuestion.correctAnswer) {
      // Incorrect answer: recycle it to the end of the array
      // We also reshuffle its options so it looks fresh when they see it again
      setQuestions(prev => [
        ...prev, 
        { ...currentQuestion, options: shuffleArray(currentQuestion.options) }
      ]);
    }
    setSelectedOption(null);
    setIsAnswered(false);
    setCurrentIndex(prev => prev + 1);
  };

  const renderHighlightedWord = (word, highlightIndexes) => {
    if (!highlightIndexes || highlightIndexes.length === 0) return word;
    return word.split('').map((char, index) => {
      const isHighlighted = highlightIndexes.includes(index);
      return (
        <span 
          key={index} 
          style={{ 
            color: isHighlighted ? '#fa541c' : 'inherit', 
            textDecoration: isHighlighted ? 'underline' : 'none',
            fontWeight: isHighlighted ? 'bold' : 'normal'
          }}
        >
          {char}
        </span>
      );
    });
  };

  if (isFinished) {
    return (
      <Card style={{ textAlign: 'center', padding: '40px 20px', borderRadius: 16 }}>
        <Result
          status="success"
          title="Session Complete!"
          subTitle={`You correctly identified ${correctCount} out of ${data.questions.length} unique questions.`}
          extra={[
            <Button type="primary" size="large" icon={<RotateCcw size={18} />} onClick={onFinish} key="done">
              Finish
            </Button>
          ]}
        />
      </Card>
    );
  }

  return (
    <Card style={{ borderRadius: 16, boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
      {/* Progress */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
          <Text type="secondary">Question {currentIndex + 1} of {questions.length}</Text>
          <Text type="secondary">{Math.round((currentIndex / questions.length) * 100)}%</Text>
        </div>
        <Progress percent={(currentIndex / questions.length) * 100} showInfo={false} strokeColor="#fa541c" />
      </div>

      {/* Question Header */}
      <div style={{ textAlign: 'center', marginBottom: 30 }}>
        <Title level={4} style={{ marginBottom: 10 }}>{currentQuestion.instruction}</Title>
        {currentQuestion.highlight && (
          <div style={{ display: 'inline-block', padding: '8px 16px', background: '#fff2e8', borderRadius: 8, border: '1px solid #ffbb96', fontSize: '1.2em', fontWeight: 'bold', color: '#d4380d' }}>
            Target sound: "{currentQuestion.highlight}"
          </div>
        )}
      </div>

      {/* Options Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '12px', marginBottom: 20 }}>
        {currentQuestion.options.map((option, idx) => {
          const isSelected = selectedOption === option.word;
          const isCorrectAnswer = option.word === currentQuestion.correctAnswer;
          
          let borderColor = '#d9d9d9';
          let bgColor = '#fff';

          if (isAnswered) {
            if (isCorrectAnswer) {
              borderColor = '#52c41a'; // Green
              bgColor = '#f6ffed';
            } else if (isSelected && !isCorrectAnswer) {
              borderColor = '#ff4d4f'; // Red
              bgColor = '#fff2f0';
            }
          } else if (isSelected) {
            borderColor = '#fa541c';
          }

          return (
            <div 
              key={idx}
              onClick={() => handleSelectOption(option.word)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '16px 20px',
                border: `2px solid ${borderColor}`,
                borderRadius: '12px',
                background: bgColor,
                cursor: isAnswered ? 'default' : 'pointer',
                transition: 'all 0.2s',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                <Button 
                  shape="circle" 
                  icon={<Volume2 size={16} />} 
                  onClick={(e) => playAudio(option.word, e)}
                />
                <Text style={{ fontSize: '1.2em' }}>
                  {renderHighlightedWord(option.word, option.highlightIndexes)}
                </Text>
              </div>

              {/* Reveal IPA and Icons after answering */}
              {isAnswered && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Text type="secondary" style={{ fontFamily: 'monospace', fontSize: '1.1em', background: '#f0f0f0', padding: '2px 6px', borderRadius: 4 }}>
                    {option.ipa}
                  </Text>
                  {isCorrectAnswer && <CheckCircle2 color="#52c41a" />}
                  {isSelected && !isCorrectAnswer && <XCircle color="#ff4d4f" />}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Explanation & Next Button */}
      {isAnswered && (
        <div style={{ marginTop: 20, animation: 'fadeIn 0.5s' }}>
          <Alert
            message={selectedOption === currentQuestion.correctAnswer ? "Correct!" : "Incorrect"}
            description={currentQuestion.explanation}
            type={selectedOption === currentQuestion.correctAnswer ? "success" : "error"}
            showIcon
            style={{ marginBottom: 20, borderRadius: 8 }}
          />
          <Button 
            type="primary" 
            size="large" 
            block 
            icon={<ArrowRight size={18} />} 
            onClick={handleNext}
            style={{ background: '#fa541c', borderColor: '#fa541c', height: '50px', fontSize: '1.1em' }}
          >
            {selectedOption !== currentQuestion.correctAnswer ? "Review Later & Next" : "Next Question"}
          </Button>
        </div>
      )}
    </Card>
  );
};

export default PhoneticSession;