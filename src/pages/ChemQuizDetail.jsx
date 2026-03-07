import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { Result, Button, Spin, Typography, Flex } from 'antd';
import { CheckCircle, XCircle } from 'lucide-react';
import { getChemistryById } from '../firebase/chemistryService';

import 'katex/dist/katex.min.css';
import { BlockMath, InlineMath } from 'react-katex';

const { Title } = Typography;

const ChemQuizDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  const numbersParam = searchParams.get('numbers');
  const initialNumbers = numbersParam ? parseInt(numbersParam, 10) : null;

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      const res = await getChemistryById(id);
      setData(res);
      setLoading(false);
    };
    fetch();
  }, [id]);

  if (loading) return <Spin size="large" style={{ display: 'block', margin: '100px auto' }} />;

  if (!data) return (
    <Result
      status="404"
      title="Chemistry Quiz Not Found"
      extra={<Button type="primary" onClick={() => navigate('/chem-quizzes')}>Back to List</Button>}
    />
  );

  return (
    <ChemQuizInteractiveSession 
      data={data} 
      onHome={() => navigate('/chem-quizzes')} 
      initialNumbers={initialNumbers} 
    />
  );
};

// Interactive session handling KaTeX syntax
const ChemQuizInteractiveSession = ({ data, onHome, initialNumbers }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);

  const questions = Array.isArray(data) ? data.flatMap(d => d.questions) : (data.questions || []);
  const totalQuestions = initialNumbers ? Math.min(initialNumbers, questions.length) : questions.length;
  
  const currentQuestion = questions[currentIndex];

  const renderMixedText = (text) => {
    if (!text || typeof text !== 'string') return text;
    if (!text.includes('$')) return <span>{text}</span>;
    const parts = text.split(/\$(.*?)\$/g);
    return parts.map((part, index) => (
      index % 2 === 1 ? <InlineMath key={index} math={part} /> : <span key={index}>{part}</span>
    ));
  };

  const handleAnswer = (opt) => {
    if (selectedAnswer !== null) return; // Prevent multiple clicks
    
    const correctAnswer = currentQuestion.correctAnswer || currentQuestion.answer;
    const isCorrect = String(opt).trim() === String(correctAnswer).trim();
    
    setSelectedAnswer(opt);
    if (isCorrect) setScore(prev => prev + 1);

    setTimeout(() => {
      if (currentIndex + 1 < totalQuestions) {
        setCurrentIndex(currentIndex + 1);
        setSelectedAnswer(null);
      } else {
        setFinished(true);
      }
    }, 1500); 
  };

  if (finished) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-2xl shadow-lg w-full max-w-lg text-center">
          <Result
            status="success"
            title="Quiz Completed!"
            subTitle={`You scored ${score} out of ${totalQuestions}`}
            extra={[
              <Button type="primary" size="large" key="home" onClick={onHome}>
                Back to List
              </Button>,
              <Button size="large" key="retry" onClick={() => {
                setCurrentIndex(0);
                setScore(0);
                setFinished(false);
                setSelectedAnswer(null);
              }}>
                Retry
              </Button>,
            ]}
          />
        </div>
      </div>
    );
  }

  if (!currentQuestion) return null;

  const correctAnswer = currentQuestion.correctAnswer || currentQuestion.answer;

  return (
    <div className="max-w-3xl mx-auto p-4 sm:p-8 mt-8 bg-white rounded-xl shadow-md">
      <div className="flex justify-between items-center mb-6">
         <h2 className="text-xl font-bold text-gray-800">{data.title || 'Chemistry Quiz'}</h2>
         <span className="text-gray-500 font-medium">Question {currentIndex + 1} of {totalQuestions}</span>
      </div>
      
      <div className="mb-8 p-6 border border-gray-100 rounded-lg bg-gray-50">
        <Title level={4} style={{ marginTop: 0 }}>
          {currentIndex + 1}. {renderMixedText(currentQuestion.text || currentQuestion.question)}
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
          
          if (selectedAnswer !== null) {
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
              onClick={() => handleAnswer(opt)}
              disabled={selectedAnswer !== null}
            >
              <Flex justify="space-between" align="center" style={{ width: '100%' }}>
                 <span>{renderMixedText(opt)}</span>
                 {selectedAnswer !== null && String(opt).trim() === String(correctAnswer).trim() && <CheckCircle size={20} />}
                 {selectedAnswer !== null && String(opt).trim() === String(selectedAnswer).trim() && String(opt).trim() !== String(correctAnswer).trim() && <XCircle size={20} />}
              </Flex>
            </Button>
          );
        })}
      </Flex>
    </div>
  );
};

export default ChemQuizDetail;