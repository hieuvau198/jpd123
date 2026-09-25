// src/pages/ReadingList.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Typography, Row, Col, Spin, Button, Tag } from 'antd';
import { ArrowLeft, BookOpen, Clock, Layers } from 'lucide-react';
import { getAllReadings } from '../firebase/readingService';
import PracticeCard from '../components/PracticeCard';

const { Title, Text } = Typography;

const ReadingList = () => {
  const navigate = useNavigate();
  const [readings, setReadings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReadings = async () => {
      setLoading(true);
      try {
        const data = await getAllReadings();
        setReadings(data || []);
      } catch (err) {
        console.error("Error loading readings:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchReadings();
  }, []);

  return (
    <div className="min-h-screen p-4 sm:p-8 max-w-7xl mx-auto mt-8">
      <div className="flex flex-col gap-4 mb-8">
        

        <div className="flex items-center gap-3">
          <BookOpen size={36} className="text-amber-300" />
          <div>
            <Title level={2} style={{ color: '#fff', margin: 0 }}>
              Reading Practice
            </Title>
            <Text className="text-white/80">
              Luyện tập đọc hiểu, ngữ pháp & mở rộng vốn từ vựng ngữ cảnh.
            </Text>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <Spin size="large" />
        </div>
      ) : readings.length === 0 ? (
        <div className="bg-white/90 rounded-2xl p-12 text-center max-w-md mx-auto shadow-lg">
          <Title level={4}>Chưa có bài đọc nào</Title>
          <Text type="secondary">
            Vui lòng thêm bài tập mới từ trang Admin để bắt đầu luyện tập.
          </Text>
        </div>
      ) : (
        <Row gutter={[20, 20]}>
          {readings.map((item) => (
            <Col xs={24} sm={12} lg={8} key={item.id}>
              <PracticeCard
                practice={item}
                onClick={() => navigate(`/reading/${item.id}`)}
              />
            </Col>
          ))}
        </Row>
      )}
    </div>
  );
};

export default ReadingList;