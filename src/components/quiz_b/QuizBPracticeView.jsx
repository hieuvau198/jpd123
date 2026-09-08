// src/components/quiz_b/QuizBPracticeView.jsx
import React, { useState, useEffect } from 'react';
import { Card, Button, Typography, Flex, Alert, Progress, Tag } from 'antd';
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

  // Queue câu hỏi của section hiện tại
  const [questionsQueue, setQuestionsQueue] = useState([]);
  const [initialCount, setInitialCount] = useState(0);
  const [firstTryScore, setFirstTryScore] = useState(0);
  const [selectedOption, setSelectedOption] = useState(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [isSectionFinished, setIsSectionFinished] = useState(false);
  const [isAllFinished, setIsAllFinished] = useState(false);

  // Khởi tạo câu hỏi cho section được chọn
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

    // Nếu sai và bật lặp lại câu sai
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
        restartText="Luyện tập lại"
        resultMessage={`Chúc mừng! Bạn đã hoàn thành toàn bộ các phần bài tập của bộ đề: ${quizTitle}`}
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
      <Card className="text-center p-8 rounded-3xl shadow-lg border-0 bg-white max-w-xl mx-auto my-8">
        <CheckCircle size={56} className="text-green-500 mx-auto mb-4" />
        <Title level={3}>Hoàn thành {currentSection?.title}!</Title>
        <Text type="secondary" className="text-base block mb-6">
          Đúng trong lần đầu: <strong className="text-green-600 text-xl">{firstTryScore}</strong> / {initialCount} ({secPercent}%)
        </Text>

        <Flex justify="center" gap="middle">
          <Button
            icon={<RotateCcw size={16} />}
            onClick={() => loadSection(activeSectionIdx)}
            className="rounded-xl h-11 px-5"
          >
            Luyện tập lại phần này
          </Button>
          <Button
            type="primary"
            onClick={handleNextSection}
            className="bg-blue-600 hover:bg-blue-500 rounded-xl h-11 px-6 font-semibold"
          >
            {hasNextSection ? 'Sang phần tiếp theo' : 'Xem tổng kết bài học'}
          </Button>
        </Flex>
      </Card>
    );
  }

  if (!currentQuestion) return null;

  return (
    <div className="flex flex-col gap-5">
      {/* Thanh tab các phần bài tập */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none border-b border-gray-100">
        {sections.map((sec, idx) => (
          <button
            key={sec.section_id || idx}
            onClick={() => setActiveSectionIdx(idx)}
            className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm font-semibold whitespace-nowrap transition-all ${
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
      <Card className="rounded-3xl shadow-md border-0 bg-white p-2 sm:p-4">
        <Flex justify="space-between" align="center" className="mb-4">
          <Tag color="purple" className="px-3 py-1 rounded-full text-xs font-bold uppercase">
            {currentSection?.title}
          </Tag>
          <Text strong className="text-gray-500">
            Còn lại: {questionsQueue.length} câu
          </Text>
        </Flex>

        {currentSection?.description && (
          <Text type="secondary" className="block text-xs mb-4 italic">
            {currentSection.description}
          </Text>
        )}

        {/* Câu hỏi */}
        <div className="p-5 bg-gray-50 rounded-2xl mb-6 border border-gray-100">
          <Title level={4} className="!m-0 text-slate-800">
            {!currentQuestion._firstTry && (
              <Tag color="orange" className="mr-2">Ôn lại câu sai</Tag>
            )}
            {currentQuestion.prompt}
          </Title>
        </div>

        {/* Các lựa chọn trắc nghiệm */}
        <Flex vertical gap="middle" className="mb-6">
          {currentQuestion.options?.map((opt) => {
            const isSelected = selectedOption === opt.id;
            const isCorrect = opt.id === currentQuestion.correct_option_id;

            let btnStyle = {
              height: 'auto',
              minHeight: '52px',
              padding: '14px 20px',
              textAlign: 'left',
              fontSize: '1.05rem',
              borderRadius: '14px',
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
              >
                <Flex justify="space-between" align="center" style={{ width: '100%' }}>
                  <span>
                    <strong>{opt.id}.</strong> {opt.text}
                  </span>
                  {isAnswered && isCorrect && <CheckCircle size={20} className="text-white" />}
                  {isAnswered && isSelected && !isCorrect && <XCircle size={20} className="text-white" />}
                </Flex>
              </Button>
            );
          })}
        </Flex>

        {/* Giải thích sau khi làm */}
        {isAnswered && currentQuestion.explanation && (
          <Alert
            message={<span className="font-bold">Giải thích chi tiết</span>}
            description={currentQuestion.explanation}
            type="info"
            showIcon
            icon={<Brain size={20} />}
            className="mb-6 rounded-xl"
          />
        )}

        {/* Nút Next */}
        {isAnswered && (
          <Flex justify="end">
            <Button
              type="primary"
              size="large"
              icon={<ArrowRight size={18} />}
              onClick={handleNext}
              className="px-8 rounded-xl bg-slate-900 hover:bg-slate-800 border-none font-semibold"
            >
              Tiếp tục
            </Button>
          </Flex>
        )}
      </Card>
    </div>
  );
};

export default QuizBPracticeView;