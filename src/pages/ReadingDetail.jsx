// src/pages/ReadingDetail.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Spin, Button, Typography, Tabs } from 'antd';
import { getReadingById } from '../firebase/readingService';
import ReadingSessionHeader from '../components/reading/ReadingSessionHeader';
import { SECTION_REGISTRY, getSectionHandler } from '../components/reading/sections';

const { Title } = Typography;

const ReadingDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Map lưu câu trả lời theo sectionId: { [secId]: answers }
  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [scoreResult, setScoreResult] = useState(null);
  const [activeTab, setActiveTab] = useState('0');

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const res = await getReadingById(id);
        if (res) {
          setData(res);
          // Khởi tạo state câu trả lời mặc định nếu cần
          const initial = {};
          (res.sections || []).forEach(sec => {
            if (sec.type === 'sentence-ordering' && sec.scrambled_items) {
              initial[sec.id] = sec.scrambled_items.map(i => i.id);
            }
          });
          setAnswers(initial);
        }
      } catch (err) {
        console.error("Error loading reading data:", err);
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchData();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex justify-center items-center">
        <Spin size="large" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-8 text-center text-white">
        <Title level={3} style={{ color: '#fff' }}>Không tìm thấy bài đọc</Title>
        <Button onClick={() => navigate('/reading')}>Quay lại</Button>
      </div>
    );
  }

  const handleSectionAnswerChange = (secId, value) => {
    setAnswers(prev => ({ ...prev, [secId]: value }));
  };

  const handleSubmit = () => {
    let totalQuestions = 0;
    let totalCorrect = 0;

    (data.sections || []).forEach(sec => {
      const handler = getSectionHandler(sec.type);
      if (handler?.calculateScore) {
        const result = handler.calculateScore(sec, answers);
        totalQuestions += result.total;
        totalCorrect += result.correct;
      }
    });

    const score = totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 100;
    setScoreResult({ score, totalCorrect, totalQuestions });
    setSubmitted(true);
  };

  const handleReset = () => {
    setSubmitted(false);
    setScoreResult(null);
  };

  const sections = data.sections || [];

  return (
    <div className="min-h-screen p-4 sm:p-8 max-w-6xl mx-auto mt-6">
      <ReadingSessionHeader
        data={data}
        submitted={submitted}
        scoreResult={scoreResult}
        onBack={() => navigate('/reading')}
        onSubmit={handleSubmit}
        onReset={handleReset}
      />

      <div className="bg-white/95 backdrop-blur-md p-6 rounded-2xl shadow-lg">
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={sections.map((sec, idx) => {
            const handler = getSectionHandler(sec.type);
            const SectionComponent = handler?.component;

            return {
              key: String(idx),
              label: (
                <span className="font-semibold text-sm">
                  Section {idx + 1}: {handler?.name || sec.title || 'Bài tập'}
                </span>
              ),
              children: (
                <div className="py-2">
                  <Title level={4} style={{ marginBottom: 16 }}>{sec.title}</Title>
                  {SectionComponent ? (
                    <SectionComponent
                      section={sec}
                      value={answers[sec.id]}
                      onChange={(newVal) => handleSectionAnswerChange(sec.id, newVal)}
                      submitted={submitted}
                      glossary={data.glossary}
                    />
                  ) : (
                    <div className="text-gray-400 py-6">
                      Dạng câu hỏi <code>{sec.type}</code> chưa được hỗ trợ.
                    </div>
                  )}
                </div>
              ),
            };
          })}
        />
      </div>
    </div>
  );
};

export default ReadingDetail;