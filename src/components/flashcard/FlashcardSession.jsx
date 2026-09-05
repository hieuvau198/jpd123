import React, { useState, useEffect, useMemo } from 'react';
import { Button, Typography, Flex, Checkbox, Card } from 'antd';
import { 
  ArrowLeft, 
  ArrowRight, 
  RotateCw, 
  Volume2, 
  Layers, 
  RotateCcw 
} from 'lucide-react';
import SessionResult from '../SessionResult';

const { Title, Text } = Typography;

const shuffleArray = (array) => {
  const newArr = [...array];
  for (let i = newArr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArr[i], newArr[j]] = [newArr[j], newArr[i]];
  }
  return newArr;
};

const FlashcardSession = ({ data, onHome, onBack }) => {
  const isTypeB = useMemo(() => {
    return data?.type === 'flashcard-b' || (Array.isArray(data?.words) && data.words.length > 0);
  }, [data]);

  // Bộ chọn nội dung cho Type-B
  const [selectedTypes, setSelectedTypes] = useState({
    words: true,
    phrases: false,
    sentences: false,
  });
  const [isConfigured, setIsConfigured] = useState(!isTypeB);

  const [cards, setCards] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isFinished, setIsFinished] = useState(false);

  // Khởi tạo danh sách thẻ dựa trên lựa chọn
  const buildCardsList = () => {
    if (!data) return [];

    if (isTypeB) {
      const result = [];
      const rawWords = data.words || [];

      rawWords.forEach((item, idx) => {
        // Từ vựng
        if (selectedTypes.words && item.word) {
          const meaning = item.defs && item.defs.length > 0
            ? item.defs.map(d => d.m).join(', ')
            : (item.answer || '');
          result.push({
            id: `word-${idx}`,
            front: item.word,
            back: meaning,
            speak: item.word,
            ipa: item.ipa || '',
            tag: 'Từ vựng'
          });
        }

        // Cụm từ
        if (selectedTypes.phrases && Array.isArray(item.phrases)) {
          item.phrases.forEach((p, pIdx) => {
            result.push({
              id: `phrase-${idx}-${pIdx}`,
              front: p.text,
              back: p.m,
              speak: p.text,
              tag: 'Cụm từ'
            });
          });
        }

        // Câu ví dụ
        if (selectedTypes.sentences && Array.isArray(item.sentences)) {
          item.sentences.forEach((s, sIdx) => {
            result.push({
              id: `sentence-${idx}-${sIdx}`,
              front: s.text,
              back: s.m,
              speak: s.text,
              tag: 'Câu'
            });
          });
        }
      });
      return shuffleArray(result);
    }

    // Flashcard thông thường
    const rawQuestions = data.questions || [];
    return shuffleArray(rawQuestions.map((q, idx) => ({
      id: q.id || `q-${idx}`,
      front: q.question || q.word,
      back: q.answer || q.meaning,
      speak: q.speak || q.question || q.word,
      ipa: q.ipa || '',
      tag: 'Từ vựng'
    })));
  };

  const handleStartPractice = () => {
    const list = buildCardsList();
    if (list.length === 0) return;
    setCards(list);
    setCurrentIndex(0);
    setIsFlipped(false);
    setIsFinished(false);
    setIsConfigured(true);
  };

  useEffect(() => {
    if (!isTypeB && data) {
      handleStartPractice();
    }
  }, [data, isTypeB]);

  // Đọc từ vựng
  const handleSpeech = (text) => {
    if (!text || typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';
    utterance.rate = 0.9;
    window.speechSynthesis.speak(utterance);
  };

  const handleNext = () => {
    if (currentIndex < cards.length - 1) {
      setIsFlipped(false);
      setCurrentIndex(prev => prev + 1);
    } else {
      setIsFinished(true);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setIsFlipped(false);
      setCurrentIndex(prev => prev - 1);
    }
  };

  const handleFlip = () => {
    setIsFlipped(prev => !prev);
  };

  // Hỗ trợ phím tắt Space và mũi tên trái/phải
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isConfigured || isFinished || cards.length === 0) return;
      if (e.code === 'Space') {
        e.preventDefault();
        handleFlip();
      } else if (e.code === 'ArrowRight') {
        e.preventDefault();
        handleNext();
      } else if (e.code === 'ArrowLeft') {
        e.preventDefault();
        handlePrev();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isConfigured, isFinished, currentIndex, cards.length]);

  // Màn hình chọn nội dung luyện tập cho Type-B
  if (isTypeB && !isConfigured) {
    const isAnySelected = selectedTypes.words || selectedTypes.phrases || selectedTypes.sentences;
    return (
      <div style={{ maxWidth: 540, margin: '60px auto', padding: '0 20px' }}>
        <Card
          style={{
            borderRadius: 20,
            boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
            border: 'none',
            textAlign: 'center',
            padding: '24px 16px'
          }}
        >
          <Layers size={48} color="#1890ff" style={{ margin: '0 auto 16px' }} />
          <Title level={3} style={{ marginBottom: 8 }}>Chọn nội dung học</Title>
          <Text type="secondary" style={{ display: 'block', marginBottom: 28, fontSize: 14 }}>
            Bộ thẻ này có thêm cụm từ và câu ví dụ. Bạn muốn luyện tập nội dung nào?
          </Text>

          <Flex vertical gap="middle" style={{ textAlign: 'left', maxWidth: 320, margin: '0 auto 32px' }}>
            <Checkbox
              checked={selectedTypes.words}
              onChange={(e) => setSelectedTypes({ ...selectedTypes, words: e.target.checked })}
              style={{ fontSize: 16 }}
            >
              Từ vựng chính (Words)
            </Checkbox>
            <Checkbox
              checked={selectedTypes.phrases}
              onChange={(e) => setSelectedTypes({ ...selectedTypes, phrases: e.target.checked })}
              style={{ fontSize: 16 }}
            >
              Cụm từ liên quan (Phrases)
            </Checkbox>
            <Checkbox
              checked={selectedTypes.sentences}
              onChange={(e) => setSelectedTypes({ ...selectedTypes, sentences: e.target.checked })}
              style={{ fontSize: 16 }}
            >
              Câu ví dụ (Sentences)
            </Checkbox>
          </Flex>

          <Flex justify="center" gap="middle">
            <Button size="large" onClick={onBack}>
              Quay lại
            </Button>
            <Button
              type="primary"
              size="large"
              disabled={!isAnySelected}
              onClick={handleStartPractice}
              style={{ padding: '0 32px' }}
            >
              Bắt đầu học
            </Button>
          </Flex>
        </Card>
      </div>
    );
  }

  // Kết thúc lượt học
  if (isFinished) {
    return (
      <SessionResult
        score={100}
        onBack={onBack}
        onRestart={() => {
          setCards(buildCardsList());
          setCurrentIndex(0);
          setIsFlipped(false);
          setIsFinished(false);
        }}
        practiceId={data.id}
        practiceType="Flashcard"
        practiceName={data.title}
        backText="Quay về menu"
        restartText="Học lại"
        resultMessage={`Tuyệt vời! Bạn đã xem qua toàn bộ ${cards.length} thẻ!`}
      />
    );
  }

  if (cards.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: 60 }}>
        <Title level={4} style={{ color: 'white' }}>Không tìm thấy thẻ nào phù hợp!</Title>
        <Button onClick={onBack} style={{ marginTop: 16 }}>Quay lại</Button>
      </div>
    );
  }

  const currentCard = cards[currentIndex];

  return (
    <div style={{ maxWidth: 680, margin: '20px auto', padding: '0 20px' }}>
      {/* Thanh công cụ phía trên */}
      <Flex justify="space-between" align="center" style={{ marginBottom: 16 }}>
        <Button icon={<ArrowLeft size={18} />} onClick={onBack}>
          Thoát
        </Button>
        <div style={{ textAlign: 'center' }}>
          <Text strong style={{ fontSize: 16, color: 'white' }}>
            {currentIndex + 1} / {cards.length}
          </Text>
          {currentCard.tag && (
            <span style={{
              display: 'inline-block',
              marginLeft: 8,
              padding: '2px 8px',
              fontSize: 12,
              background: 'rgba(255,255,255,0.25)',
              color: 'white',
              borderRadius: 12
            }}>
              {currentCard.tag}
            </span>
          )}
        </div>
        <Button 
          icon={<RotateCcw size={16} />} 
          onClick={() => {
            setCards(buildCardsList());
            setCurrentIndex(0);
            setIsFlipped(false);
          }}
          title="Xáo trộn lại"
        />
      </Flex>

      {/* Thẻ 3D Flip */}
      <div 
        className="perspective-container" 
        style={{ width: '100%', height: 380, cursor: 'pointer', margin: '0 auto 24px' }}
        onClick={handleFlip}
      >
        <div className={`card-inner ${isFlipped ? 'flipped' : ''}`}>
          
          {/* Mặt trước: Từ vựng / Nội dung chính */}
          <div 
            className="card-front" 
            style={{
              borderRadius: 24,
              backgroundColor: '#ffffff',
              boxShadow: '0 10px 30px rgba(0,0,0,0.12)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              padding: '28px'
            }}
          >
            <Flex justify="space-between" align="center">
              <Text type="secondary" style={{ fontSize: 13, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                Mặt trước (Nhấn để lật)
              </Text>
              <Button
                type="text"
                shape="circle"
                icon={<Volume2 size={24} color="#1890ff" />}
                onClick={(e) => {
                  e.stopPropagation();
                  handleSpeech(currentCard.speak);
                }}
              />
            </Flex>

            <Flex vertical align="center" justify="center" style={{ flex: 1 }}>
              <Title level={2} style={{ margin: 0, color: '#1890ff', textAlign: 'center' }}>
                {currentCard.front}
              </Title>
              {currentCard.ipa && (
                <Text type="secondary" style={{ fontSize: 16, marginTop: 8, fontFamily: 'monospace' }}>
                  /{currentCard.ipa}/
                </Text>
              )}
            </Flex>

            <Text type="secondary" style={{ textAlign: 'center', fontSize: 12 }}>
              Nhấn vào thẻ hoặc nhấn Space để xem nghĩa
            </Text>
          </div>

          {/* Mặt sau: Nghĩa */}
          <div 
            className="card-back" 
            style={{
              borderRadius: 24,
              backgroundColor: '#ffffff',
              boxShadow: '0 10px 30px rgba(0,0,0,0.12)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              padding: '28px',
              border: '2px solid #52c41a'
            }}
          >
            <Flex justify="space-between" align="center">
              <Text type="secondary" style={{ fontSize: 13, textTransform: 'uppercase', letterSpacing: 0.5, color: '#52c41a' }}>
                Định nghĩa / Nghĩa
              </Text>
              <Button
                type="text"
                shape="circle"
                icon={<Volume2 size={24} color="#52c41a" />}
                onClick={(e) => {
                  e.stopPropagation();
                  handleSpeech(currentCard.speak);
                }}
              />
            </Flex>

            <Flex vertical align="center" justify="center" style={{ flex: 1 }}>
              <Title level={3} style={{ margin: 0, color: '#262626', textAlign: 'center', fontWeight: 600 }}>
                {currentCard.back}
              </Title>
              <Text type="secondary" style={{ marginTop: 12, fontSize: 14 }}>
                {currentCard.front}
              </Text>
            </Flex>

            <Text type="secondary" style={{ textAlign: 'center', fontSize: 12 }}>
              Nhấn vào thẻ hoặc nhấn Space để lật lại
            </Text>
          </div>
        </div>
      </div>

      {/* Điều khiển bên dưới */}
      <Flex justify="center" align="center" gap="large">
        <Button
          size="large"
          icon={<ArrowLeft size={18} />}
          onClick={handlePrev}
          disabled={currentIndex === 0}
          style={{ minWidth: 110, height: 48, borderRadius: 12, fontWeight: 500 }}
        >
          Trước
        </Button>

        <Button
          type="primary"
          size="large"
          icon={<RotateCw size={18} />}
          onClick={handleFlip}
          style={{ minWidth: 130, height: 48, borderRadius: 12, fontWeight: 600, background: '#1890ff' }}
        >
          Xoay
        </Button>

        <Button
          size="large"
          icon={<ArrowRight size={18} />}
          onClick={handleNext}
          style={{ minWidth: 110, height: 48, borderRadius: 12, fontWeight: 500 }}
        >
          {currentIndex === cards.length - 1 ? 'Hoàn thành' : 'Tiếp theo'}
        </Button>
      </Flex>
    </div>
  );
};

export default FlashcardSession;