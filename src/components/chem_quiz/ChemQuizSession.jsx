// src/components/chem_quiz/ChemQuizSession.jsx
import React, { useState, useEffect } from 'react';
import { Button, Typography, Flex, Alert, Tooltip } from 'antd';
import { CheckCircle, XCircle, ArrowRight, Shuffle, Undo2 } from 'lucide-react';
import 'katex/dist/katex.min.css';
import { BlockMath, InlineMath } from 'react-katex';
import SessionResult from '../SessionResult';

const { Title, Text } = Typography;

// Thuật toán xáo trộn Fisher-Yates
const shuffleArray = (array) => {
  const newArr = [...array];
  for (let i = newArr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArr[i], newArr[j]] = [newArr[j], newArr[i]];
  }
  return newArr;
};

const ChemQuizSession = ({ data, onHome, initialNumbers, practiceId }) => {
  const [queue, setQueue] = useState([]);
  const [score, setScore] = useState(0);
  const [totalAttempted, setTotalAttempted] = useState(0);
  const [finished, setFinished] = useState(false);
  
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [isAnswered, setIsAnswered] = useState(false);

  // Lưu lịch sử các câu đã trả lời để người dùng có thể xem lại
  const [answeredHistory, setAnsweredHistory] = useState([]);
  // Chỉ số câu đang xem lại (null nếu đang làm câu hiện tại trong queue)
  const [reviewIndex, setReviewIndex] = useState(null);

  useEffect(() => {
    // Khởi tạo danh sách: Mặc định KHÔNG trộn câu hỏi
    const questions = Array.isArray(data) ? data.flatMap(d => d.questions) : (data.questions || []);
    const initialQuestions = initialNumbers ? questions.slice(0, initialNumbers) : questions;
    
    setQueue(initialQuestions);
    setTotalAttempted(initialQuestions.length);
    setAnsweredHistory([]);
    setReviewIndex(null);
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

  // Xác định câu hỏi hiện đang hiển thị: Đang review hay đang làm câu đầu queue
  const isReviewing = reviewIndex !== null && answeredHistory[reviewIndex];
  const currentQuestion = isReviewing ? answeredHistory[reviewIndex].question : queue[0];
  const correctAnswer = currentQuestion?.correctAnswer || currentQuestion?.answer;

  // Lựa chọn đáp án khi đang xem lại hoặc khi đang làm bài
  const activeSelectedAnswer = isReviewing 
    ? answeredHistory[reviewIndex].selectedAnswer 
    : selectedAnswer;
  const activeIsAnswered = isReviewing ? true : isAnswered;

  const handleSelectAnswer = (opt) => {
    if (activeIsAnswered || isReviewing) return; 
    setSelectedAnswer(opt);
    setIsAnswered(true);
  };

  const handleNext = () => {
    const isCorrect = String(selectedAnswer).trim() === String(correctAnswer).trim();
    let newQueue = [...queue];
    const answeredQuestion = newQueue.shift();

    // Lưu vào lịch sử để hiển thị danh sách các câu đã làm
    setAnsweredHistory(prev => [
      ...prev,
      {
        question: answeredQuestion,
        selectedAnswer: selectedAnswer,
        isCorrect: isCorrect
      }
    ]);

    // Logic cũ: nếu sai thì lặp lại ở vị trí thứ 3 và thứ 6
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
    setReviewIndex(null);

    if (newQueue.length === 0) {
      setFinished(true);
    }
  };

  // Bấm nút "Trộn": chỉ xáo trộn các câu còn lại trong hàng đợi
  const handleShuffle = () => {
    if (queue.length <= 1) return;
    setQueue(prevQueue => {
      // Giữ nguyên câu đang hiển thị nếu đã chọn đáp án, nếu chưa thì trộn toàn bộ
      if (isAnswered) {
        const [current, ...rest] = prevQueue;
        return [current, ...shuffleArray(rest)];
      }
      return shuffleArray(prevQueue);
    });
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
    setAnsweredHistory([]);
    setReviewIndex(null);
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
        practiceName={data.title}
      />
    );
  }

  if (!currentQuestion) return null;

  return (
    <div className="max-w-3xl mx-4 sm:mx-auto p-4 sm:p-8 mt-20 bg-white rounded-xl shadow-md pb-24">
      {/* Top Header Controls */}
      <div className="flex justify-between items-center mb-4 flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-bold text-gray-800 m-0">{data.title || 'Chemistry Quiz'}</h2>
          <span className="text-gray-500 font-medium text-sm">Còn lại: {queue.length} câu</span>
        </div>

        <Flex gap="small" align="center">
          {/* Nút Trộn câu hỏi */}
          <Tooltip title="Trộn thứ tự các câu hỏi còn lại">
            <Button 
              icon={<Shuffle size={16} />} 
              onClick={handleShuffle}
              disabled={queue.length <= 1 || isReviewing}
              className="flex items-center"
            >
              Trộn
            </Button>
          </Tooltip>

          {isReviewing && (
            <Button 
              type="primary" 
              icon={<Undo2 size={16} />}
              onClick={() => setReviewIndex(null)}
              className="flex items-center"
            >
              Về câu hiện tại
            </Button>
          )}
        </Flex>
      </div>

      {/* Thanh danh sách số câu đã làm để bấm vào xem lại */}
      {answeredHistory.length > 0 && (
        <div className="mb-6 p-3 bg-slate-50 border border-slate-200 rounded-lg">
          <div className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">
            Lịch sử làm bài (Bấm số để xem lại):
          </div>
          <div className="flex flex-wrap gap-1.5 items-center">
            {answeredHistory.map((item, idx) => {
              const isSelectedReview = reviewIndex === idx;
              let btnClass = item.isCorrect 
                ? 'bg-emerald-100 text-emerald-800 border-emerald-300' 
                : 'bg-rose-100 text-rose-800 border-rose-300';
              
              if (isSelectedReview) {
                btnClass = 'ring-2 ring-indigo-500 font-bold ' + btnClass;
              }

              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setReviewIndex(idx)}
                  className={`w-8 h-8 rounded-lg border text-xs font-semibold flex items-center justify-center transition-all ${btnClass}`}
                >
                  {idx + 1}
                </button>
              );
            })}
            
            {/* Nút đại diện cho câu đang làm hiện tại */}
            <button
              type="button"
              onClick={() => setReviewIndex(null)}
              className={`px-3 h-8 rounded-lg border text-xs font-bold transition-all ${
                reviewIndex === null
                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                  : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-100'
              }`}
            >
              Câu hiện tại
            </button>
          </div>
        </div>
      )}

      {/* Hiển thị thông báo khi đang ở chế độ xem lại */}
      {isReviewing && (
        <Alert
          message={`Đang xem lại câu số ${reviewIndex + 1}`}
          description={
            answeredHistory[reviewIndex].isCorrect 
              ? 'Bạn đã trả lời đúng câu này.' 
              : 'Bạn đã trả lời sai câu này trong lần làm trước.'
          }
          type={answeredHistory[reviewIndex].isCorrect ? 'success' : 'warning'}
          showIcon
          className="mb-6"
        />
      )}

      {/* EXPLANATION */}
      {activeIsAnswered && currentQuestion.explanation && (
        <Alert
          description={<div className="text-base">{renderMixedText(currentQuestion.explanation)}</div>}
          type="info"
          showIcon
          className="mb-6"
        />
      )}
      
      {/* Khung nội dung câu hỏi */}
      <div className="mb-8 p-6 border border-gray-100 rounded-lg bg-gray-50">
        <Title level={4} style={{ marginTop: 0 }}>
          {currentQuestion._isRetry && <Text type="danger" style={{ marginRight: 8 }}>[Retry]</Text>}
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

      {/* Danh sách lựa chọn đáp án */}
      <Flex vertical gap="middle">
        {currentQuestion.options?.map((opt, idx) => {
          let buttonStyle = { 
            height: 'auto', 
            padding: '16px 20px', 
            textAlign: 'left', 
            justifyContent: 'flex-start', 
            fontSize: '1.1rem', 
            whiteSpace: 'normal', 
            wordBreak: 'break-word' 
          };
          
          if (activeIsAnswered) {
            const isThisCorrect = String(opt).trim() === String(correctAnswer).trim();
            const isThisSelected = String(opt).trim() === String(activeSelectedAnswer).trim();
            
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
              disabled={isReviewing}
            >
              <Flex justify="space-between" align="center" style={{ width: '100%', gap: '12px' }}>
                <span style={{ flex: 1, textAlign: 'left' }}>{renderMixedText(opt)}</span>
                
                {activeIsAnswered && String(opt).trim() === String(correctAnswer).trim() && (
                  <CheckCircle size={20} style={{ flexShrink: 0 }} />
                )}
                {activeIsAnswered && String(opt).trim() === String(activeSelectedAnswer).trim() && String(opt).trim() !== String(correctAnswer).trim() && (
                  <XCircle size={20} style={{ flexShrink: 0 }} />
                )}
              </Flex>
            </Button>
          );
        })}
      </Flex>

      {/* Nút NEXT khi đang làm câu hiện tại */}
      {!isReviewing && isAnswered && (
        <div className="mt-6">
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