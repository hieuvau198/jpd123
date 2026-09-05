import React, { useState } from 'react';
import { Card, Typography, Row, Col, Button } from 'antd';
import { Layers, CheckSquare, SpellCheck, ArrowLeft, Headphones } from 'lucide-react';
import CardFlipMode from './CardFlipMode';
import QuizSession from '../QuizSession';
import ListenSession from '../ListenSession';

const { Title, Text } = Typography;

const FlashcardSession = ({ data, onHome, initialNumbers }) => {
  const [selectedMode, setSelectedMode] = useState(null); // 'flashcard' | 'quiz' | 'spelling' | 'listen'

  // If a mode has been selected, render that specific mode
  if (selectedMode === 'flashcard') {
    return (
      <CardFlipMode
        data={data}
        onBack={() => setSelectedMode(null)}
        onHome={onHome}
        initialNumbers={initialNumbers}
      />
    );
  }

  if (selectedMode === 'quiz') {
    return (
      <QuizSession
        data={data}
        onHome={() => setSelectedMode(null)}
        initialNumbers={initialNumbers}
      />
    );
  }

  if (selectedMode === 'listen') {
    return (
      <ListenSession
        data={data}
        onHome={() => setSelectedMode(null)}
      />
    );
  }

  // --- MODE SELECTION SCREEN ---
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <Button
        icon={<ArrowLeft size={16} />}
        onClick={onHome}
        className="mb-6 !bg-white/90 shadow-sm"
      >
        Trở về danh sách
      </Button>

      <div className="text-center mb-10 text-white">
        <Title level={2} className="!text-white drop-shadow-md">
          {data?.title || 'Luyện tập từ vựng'}
        </Title>
        <Text className="text-white/80 text-base">
          Chọn một chế độ học để bắt đầu
        </Text>
      </div>

      <Row gutter={[24, 24]} justify="center">
        {/* Mode 1: 3D Flashcard */}
        <Col xs={24} sm={12} md={8}>
          <Card
            hoverable
            onClick={() => setSelectedMode('flashcard')}
            className="text-center h-full rounded-2xl border-0 shadow-lg hover:scale-105 transition-all p-4 bg-white/95 backdrop-blur-sm"
          >
            <div className="w-16 h-16 mx-auto mb-4 bg-yellow-100 text-yellow-600 rounded-full flex items-center justify-center">
              <Layers size={32} />
            </div>
            <Title level={3} className="!mb-2">Thẻ ghi nhớ</Title>
            <Text type="secondary">
              Lật thẻ 2 mặt (Từ vựng - Nghĩa), lặp lại từ khó và tùy chọn cụm từ, câu mẫu.
            </Text>
          </Card>
        </Col>

        {/* Mode 2: Multiple Choice Quiz */}
        <Col xs={24} sm={12} md={8}>
          <Card
            hoverable
            onClick={() => setSelectedMode('quiz')}
            className="text-center h-full rounded-2xl border-0 shadow-lg hover:scale-105 transition-all p-4 bg-white/95 backdrop-blur-sm"
          >
            <div className="w-16 h-16 mx-auto mb-4 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center">
              <CheckSquare size={32} />
            </div>
            <Title level={3} className="!mb-2">Trắc nghiệm</Title>
            <Text type="secondary">
              Luyện chọn đáp án đúng với các lựa chọn ngẫu nhiên dựa trên bộ từ.
            </Text>
          </Card>
        </Col>

        {/* Mode 3: Listening Mode */}
        <Col xs={24} sm={12} md={8}>
          <Card
            hoverable
            onClick={() => setSelectedMode('listen')}
            className="text-center h-full rounded-2xl border-0 shadow-lg hover:scale-105 transition-all p-4 bg-white/95 backdrop-blur-sm"
          >
            <div className="w-16 h-16 mx-auto mb-4 bg-pink-100 text-pink-600 rounded-full flex items-center justify-center">
              <Headphones size={32} />
            </div>
            <Title level={3} className="!mb-2">Luyện nghe</Title>
            <Text type="secondary">
              Nghe phát âm chuẩn và chọn từ vựng tương ứng.
            </Text>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default FlashcardSession;