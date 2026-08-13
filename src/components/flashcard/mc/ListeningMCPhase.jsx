import React, { useState, useEffect, useRef } from 'react';
import { Card, Button, Typography, Flex, Progress, Badge } from 'antd';
import { ArrowLeft, Volume2 } from 'lucide-react';
import MCOptionsGrid from './MCOptionsGrid';

const { Title, Text } = Typography;
const shuffleArray = (array) => [...array].sort(() => 0.5 - Math.random());

const ListeningMCPhase = ({ data, onComplete, onBack, initialWrongIds, speakText }) => {
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [wrongIds, setWrongIds] = useState(initialWrongIds);
  const [listenRemains, setListenRemains] = useState(2);
  const timerRef = useRef(null);

  useEffect(() => {
    if (!data || !data.questions) return;
    
    // Lấy tất cả từ gốc (English)
    const allEnglishWords = Array.from(new Set(data.questions.map(q => q.question)));
    
    // Chọn ngẫu nhiên phân nửa số lượng (làm tròn lên)
    const numQuestions = Math.ceil(data.questions.length / 2);
    const selectedData = shuffleArray([...data.questions]).slice(0, numQuestions);

    const prepared = selectedData.map(q => {
      const correctWord = q.question;
      // Trích ngẫu nhiên 3 từ sai cũng lấy từ gốc Tiếng Anh
      const distractors = shuffleArray(allEnglishWords.filter(w => w !== correctWord)).slice(0, 3);
      return {
        ...q,
        correctAnswer: correctWord,
        options: shuffleArray([correctWord, ...distractors]),
      };
    });

    setQuestions(prepared);
    
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    }
  }, [data]);

  useEffect(() => {
    if (questions.length > 0) {
      speakText(questions[currentIndex].correctAnswer, 'en-US');
      setListenRemains(2); // Cấp lại 2 lần bấm nghe khi qua câu mới
    }
  }, [currentIndex, questions, speakText]);

  const handleListenAgain = () => {
    if (listenRemains > 0) {
      speakText(questions[currentIndex].correctAnswer, 'en-US');
      setListenRemains(prev => prev - 1);
    }
  };

  const handleAnswerClick = (ans) => {
    if (selectedAnswer !== null) return;
    setSelectedAnswer(ans);

    const currentQ = questions[currentIndex];
    const isCorrect = ans === currentQ.correctAnswer;

    if (!isCorrect) {
      // Tích hợp sai sót vào điểm chung của bài Session
      setWrongIds(prev => new Set(prev).add(currentQ.id || currentQ.question));
    }

    timerRef.current = setTimeout(() => {
      if (currentIndex + 1 < questions.length) {
        setCurrentIndex(prev => prev + 1);
        setSelectedAnswer(null);
      } else {
        onComplete(wrongIds);
      }
    }, isCorrect ? 1000 : 2500);
  };

  if (questions.length === 0) return null;

  const currentQ = questions[currentIndex];
  const progressPercent = Math.round((currentIndex / questions.length) * 100);

  return (
    <div translate="no" className="notranslate" style={{ maxWidth: 800, margin: '0 auto', padding: 20 }}>
      <Flex justify="space-between" align="center" style={{ marginBottom: 20, marginTop: 40 }}>
        <Button icon={<ArrowLeft size={20} />} onClick={() => { window.speechSynthesis.cancel(); onBack(); }} />
        <div style={{ flex: 1, maxWidth: 300, margin: '0 20px' }}>
          <Flex vertical align="center">
            <Text strong>Phase 2 (Listening): {currentIndex + 1} / {questions.length}</Text>
            <Progress percent={progressPercent} showInfo={false} size="small" status="active" />
          </Flex>
        </div>
        <Button type="text" disabled>Bonus</Button>
      </Flex>

      <Card style={{ textAlign: 'center', marginBottom: 30, padding: '40px 20px', borderRadius: 16, boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
        <Title level={4} style={{ marginTop: 0 }}>Listen carefully and select the correct English word.</Title>
        <Badge count={listenRemains} showZero color={listenRemains > 0 ? '#1890ff' : '#ff4d4f'}>
          <Button
            type="primary"
            shape="circle"
            size="large"
            icon={<Volume2 size={32} />}
            onClick={handleListenAgain}
            disabled={listenRemains <= 0}
            style={{ width: 80, height: 80, marginTop: 20, backgroundColor: listenRemains <= 0 ? undefined : '#eb2f96' }}
          />
        </Badge>
      </Card>

      <MCOptionsGrid options={currentQ.options} selectedAnswer={selectedAnswer} correctAnswer={currentQ.correctAnswer} handleAnswerClick={handleAnswerClick} />
    </div>
  );
};

export default ListeningMCPhase;