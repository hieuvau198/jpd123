// src/components/quiz_b/QuizBPracticeView.jsx
import React, { useState, useEffect } from 'react';
import { Card, Button, Typography, Flex, Alert, Tag } from 'antd';
import { CheckCircle, XCircle, ArrowRight, RotateCcw, Brain } from 'lucide-react';
import SessionResult from '../SessionResult';

const { Title, Text } = Typography;

const shuffleArray = (arr) => {
  const cloned = [...arr];
  for (let i = cloned.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [cloned[i], cloned[j]] = [cloned[j], cloned[i]];
  }
  return cloned;
};

const QuizBPracticeView = ({ practiceData, quizId, quizTitle, onHome }) => {
  const sections = practiceData?.sections || [];
  const [activeSectionIdx, setActiveSectionIdx] = useState(0);

  // Queue của section hiện tại
  const [questionsQueue, setQuestionsQueue] = useState([]);
  const [initialCount, setInitialCount] = useState(0);
  const [firstTryScore, setFirstTryScore] = useState(0);
  const [selectedOption, setSelectedOption] = useState(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [isSectionFinished, setIsSectionFinished] = useState(false);
  const [isAllFinished, setIsAllFinished] = useState(false);

  // Khởi tạo section được chọn
  const loadSection = (idx) => {
    const sec = sections[idx];
    if (!sec || !sec.questions?.length) return;

    const config = sec.config || {};
    let rawList = sec.questions.map((q) => {
      let opts = q.options ? [...q.options] : [];
      if (config.shuffle_options) opts = shuffleArray(opts);
      return {
        ...q,
        options: opts,
        _firstTry: true,
      };
    });

    if (config.shuffle_questions) {
      rawList = shuffleArray(rawList);
    }

    setQuestionsQueue(rawList);
    setInitialCount(rawList.length);
    setFirstTryScore(0);
    setSelectedOption(null);
    setIsAnswered(false);
    setIsSectionFinished(false);
  };

  useEffect(() => {
    loadSection(activeSectionIdx);
  }, [activeSectionIdx]);

  const currentQuestion = questionsQueue[0];
  const currentSection = sections[activeSectionIdx];

  const handleSelectOption = (optId) => {
    if (isAnswered) return;
    setSelectedOption(optId);
    setIsAnswered(true);

    const isCorrect = optId === currentQuestion.correct_option_id;
    if (isCorrect && currentQuestion._firstTry) {
      setFirstTryScore((prev) => prev + 1);
    }
  };

  const handleNext = () => {
    const isCorrect = selectedOption === currentQuestion.correct_option_id;
    const secConfig = currentSection?.config || {};
    let nextQueue = [...questionsQueue];
    const finishedQ = nextQueue.shift();

    // Nếu trả lời sai và có cấu hình lặp lại câu sai
    if (!isCorrect && secConfig.repeat_wrong_answers) {
      nextQueue.push({
        ...finishedQ,
        _firstTry: false,
        options: secConfig.shuffle_options ? shuffleArray(finishedQ.options) : finishedQ.options,
      });
    }

    setQuestionsQueue(nextQueue);
    setSelectedOption(null);
    setIsAnswered(false);

    if (nextQueue.length === 0) {
      setIsSectionFinished(true);
    }
  };

  const handleNextSection = () => {
    if (activeSectionIdx + 1 < sections.length) {
      setActiveSectionIdx((prev) => prev + 1);
    } else {
      setIsAllFinished(true);
    }
  };

  if (isAllFinished) {
    return (
      <SessionResult
        score={100}
        practiceId={quizId}
        practiceType="Quiz"
        practiceName={quizTitle}
        backText="Quay lại danh sách"
        restartText="Luyện lại"
        resultMessage={`Chúc mừng! Bạn đã hoàn thành toàn bộ các phần: ${quizTitle}`}
        onBack={onHome}
        onRestart={() => {
          setIsAllFinished(false);
          setActiveSectionIdx(0);
          loadSection(0);
        }}
      />
    );
  }

  if (isSectionFinished) {
    const secPercent = initialCount > 0 ? Math.round((firstTryScore / initialCount) * 100) : 0;
    const hasNextSection = activeSectionIdx + 1 < sections.length;

    return (
      <Card className="text-center p-4 sm:p-8 rounded-3xl shadow-lg border-0 bg-white max-w-xl mx-auto my-6 sm:my-8">
        <CheckCircle size={52} className="text-green-500 mx-auto mb-4" />
        <Title level={3} className="!text-xl sm:!text-2xl">
          Hoàn thành {currentSection?.title}!
        </Title>
        <Text type="secondary" className="text-sm sm:text-base block mb-6">
          Đúng trong lần đầu: <strong className="text-green-600 text-lg sm:text-xl">{firstTryScore}</strong> / {initialCount} ({secPercent}%)
        </Text>
        <div className="flex flex-col sm:flex-row justify-center gap-3 w-full max-w-md mx-auto">
          <Button
            icon={<RotateCcw size={16} />}
            onClick={() => loadSection(activeSectionIdx)}
            className="rounded-xl h-11 px-5 w-full sm:w-auto"
          >
            Luyện lại phần này
          </Button>
          <Button
            type="primary"
            onClick={handleNextSection}
            className="bg-blue-600 hover:bg-blue-500 rounded-xl h-11 px-6 font-semibold w-full sm:w-auto"
          >
            {hasNextSection ? 'Sang phần tiếp theo' : 'Xem tổng kết'}
          </Button>
        </div>
      </Card>
    );
  }

  if (!currentQuestion) return null;

  return (
    <div className="flex flex-col gap-4 sm:gap-5 w-full">
      {/* Thanh tab các phần - Tối ưu cuộn cảm ứng cho mobile */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none border-b border-gray-100 touch-pan-x">
        {sections.map((sec, idx) => (
          <button
            key={sec.section_id || idx}
            onClick={() => setActiveSectionIdx(idx)}
            className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm font-semibold whitespace-nowrap transition-all flex-shrink-0 ${
              activeSectionIdx === idx
                ? 'bg-purple-600 text-white shadow-sm'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {sec.title || `Phần ${idx + 1}`}
          </button>
        ))}
      </div>

      {/* Practice Question Card */}
      <Card 
        className="rounded-2xl sm:rounded-3xl shadow-md border-0 bg-white"
        styles={{ body: { padding: '16px 14px' } }}
      >
        <Flex justify="space-between" align="center" className="mb-3 sm:mb-4 gap-2">
          <Tag color="purple" className="px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full text-xs font-bold uppercase truncate max-w-[200px]">
            {currentSection?.title}
          </Tag>
          <Text strong className="text-gray-500 text-xs sm:text-sm whitespace-nowrap">
            Còn lại: {questionsQueue.length} câu
          </Text>
        </Flex>

        {currentSection?.description && (
          <Text type="secondary" className="block text-xs mb-3 italic">
            {currentSection.description}
          </Text>
        )}

        {/* Câu hỏi */}
        <div className="p-3.5 sm:p-5 bg-gray-50 rounded-xl sm:rounded-2xl mb-4 sm:mb-6 border border-gray-100">
          <Title level={4} className="!m-0 text-slate-800 !text-base sm:!text-lg font-medium leading-relaxed">
            {!currentQuestion._firstTry && (
              <Tag color="orange" className="mr-2 mb-1">Làm lại câu sai</Tag>
            )}
            {currentQuestion.prompt}
          </Title>
        </div>

        {/* Các lựa chọn trắc nghiệm */}
        <div className="flex flex-col gap-2.5 sm:gap-3 mb-4 sm:mb-6">
          {currentQuestion.options?.map((opt) => {
            const isSelected = selectedOption === opt.id;
            const isCorrect = opt.id === currentQuestion.correct_option_id;

            let btnStyle = {
              height: 'auto',
              minHeight: '48px',
              padding: '10px 14px',
              textAlign: 'left',
              fontSize: '0.98rem',
              borderRadius: '12px',
              whiteSpace: 'normal',
              wordBreak: 'break-word',
            };

            if (isAnswered) {
              if (isCorrect) {
                btnStyle = { ...btnStyle, backgroundColor: '#52c41a', color: '#fff', borderColor: '#52c41a' };
              } else if (isSelected && !isCorrect) {
                btnStyle = { ...btnStyle, backgroundColor: '#ff4d4f', color: '#fff', borderColor: '#ff4d4f' };
              }
            }

            return (
              <Button
                key={opt.id}
                size="large"
                block
                style={btnStyle}
                disabled={isAnswered}
                onClick={() => handleSelectOption(opt.id)}
                className="transition-all hover:border-purple-400"
              >
                <div className="flex justify-between items-center w-full gap-2 text-left">
                  <span className="flex-1 leading-snug">
                    <strong className="mr-1">{opt.id}.</strong> {opt.text}
                  </span>
                  {isAnswered && isCorrect && (
                    <CheckCircle size={20} className="text-white flex-shrink-0" />
                  )}
                  {isAnswered && isSelected && !isCorrect && (
                    <XCircle size={20} className="text-white flex-shrink-0" />
                  )}
                </div>
              </Button>
            );
          })}
        </div>

        {/* Giải thích chi tiết sau khi làm */}
        {isAnswered && currentQuestion.explanation && (
          <Alert
            message={<span className="font-bold text-xs sm:text-sm">Giải thích chi tiết</span>}
            description={<span className="text-xs sm:text-sm">{currentQuestion.explanation}</span>}
            type="info"
            showIcon
            icon={<Brain size={18} />}
            className="mb-4 sm:mb-6 rounded-xl"
          />
        )}

        {/* Nút Next / Tiếp tục */}
        {isAnswered && (
          <div className="flex justify-stretch sm:justify-end mt-2">
            <Button
              type="primary"
              size="large"
              icon={<ArrowRight size={18} />}
              onClick={handleNext}
              className="w-full sm:w-auto px-8 rounded-xl bg-slate-900 hover:bg-slate-800 border-none font-semibold h-11 text-base flex items-center justify-center gap-2"
            >
              Tiếp tục
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
};

export default QuizBPracticeView;