import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Button, Spin, Typography, Row, Col, Tag, Space, Modal } from 'antd';
import { Wrench, ArrowLeft, Filter, Sparkles, CheckCircle2 } from 'lucide-react';
import { getAllRepairs } from '../firebase/repairService';
import availableTags from '../data/system/tags.json';
import repairModes from '../data/system/repair_modes.json'; // Đọc cấu hình từ system

const { Title, Text } = Typography;
const { CheckableTag } = Tag;

const RepairList = () => {
  const [repairs, setRepairs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTag, setSelectedTag] = useState(availableTags.length > 0 ? availableTags[0].id : 'all');
  
  // State quản lý việc chọn chế độ cho bài làm
  const [selectedSet, setSelectedSet] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    const fetchRepairs = async () => {
      const data = await getAllRepairs();
      setRepairs(data);
      setLoading(false);
    };
    fetchRepairs();
  }, []);

  const filteredRepairs = selectedTag === 'all'
    ? repairs
    : repairs.filter(item => item.tags && item.tags.includes(selectedTag));

  const handleOpenModeSelect = (set) => {
    setSelectedSet(set);
    setIsModalOpen(true);
  };

  const handleStartWithPercentage = (percentage) => {
    if (!selectedSet) return;
    setIsModalOpen(false);
    // Điều hướng kèm query param percentage
    navigate(`/repair/${selectedSet.id}?percent=${percentage}`);
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', marginTop: 50 }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 1000, margin: '20px auto', padding: 20 }}>
      <Button icon={<ArrowLeft size={16} />} onClick={() => navigate('/')} style={{ marginBottom: 20 }}>
        Back to Home
      </Button>

      <div style={{ textAlign: 'center', marginBottom: 40 }}>
        <Title level={2}>
          <Wrench style={{ verticalAlign: 'middle', marginRight: 10 }} color="#722ed1" />
          Sentence Repair Practice
        </Title>
        <p>Reorder the words to form correct sentences.</p>
        
        {/* Filter Section */}
        <div style={{ marginTop: 24 }}>
          <Space wrap size={[8, 8]} justify="center" align="center">
            <span style={{ display: 'flex', alignItems: 'center', marginRight: 8, fontWeight: 500 }}>
              <Filter size={16} style={{ marginRight: 6 }} /> Filter by:
            </span>
            <CheckableTag
              checked={selectedTag === 'all'}
              onChange={() => setSelectedTag('all')}
              style={{ border: '1px solid #d9d9d9', padding: '4px 12px', fontSize: '14px', cursor: 'pointer' }}
            >
              All
            </CheckableTag>
            {availableTags.map((tag) => (
              <CheckableTag
                key={tag.id}
                checked={selectedTag === tag.id}
                onChange={() => setSelectedTag(tag.id)}
                style={{ border: '1px solid #d9d9d9', padding: '4px 12px', fontSize: '14px', cursor: 'pointer' }}
              >
                {tag.name}
              </CheckableTag>
            ))}
          </Space>
        </div>
      </div>

      <Row gutter={[16, 16]}>
        {filteredRepairs.length > 0 ? (
          filteredRepairs.map((set) => (
            <Col xs={24} sm={12} md={8} key={set.id}>
              {/* Bấm vào thẻ để mở popup chọn chế độ */}
              <div onClick={() => handleOpenModeSelect(set)} style={{ cursor: 'pointer', height: '100%' }}>
                <Card hoverable style={{ height: '100%', borderRadius: 12, borderTop: '4px solid #722ed1' }}>
                  <Title level={4}>{set.title}</Title>
                  <div style={{ marginBottom: 12 }}>
                    <Tag color="purple">{set.questions?.length || 0} Questions</Tag>
                  </div>
                  <div>
                    {set.subject && <Tag color="blue">{set.subject}</Tag>}
                    {set.tags && set.tags.map((tag, index) => (
                      <Tag key={index} color="cyan">{tag}</Tag>
                    ))}
                  </div>
                </Card>
              </div>
            </Col>
          ))
        ) : (
          <Col span={24}>
            <div style={{ textAlign: 'center', padding: '40px 0', color: '#999', fontSize: '16px' }}>
              No repairs found for this category.
            </div>
          </Col>
        )}
      </Row>

      {/* POPUP CHỌN CHẾ ĐỘ LÀM BÀI */}
      <Modal
        title={
          <div className="flex items-center gap-2 text-indigo-700">
            <Sparkles size={20} />
            <span>Chọn số lượng câu hỏi: {selectedSet?.title}</span>
          </div>
        }
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        footer={null}
        centered
        styles={{ body: { padding: '16px 8px' } }}
      >
        <p className="text-slate-600 mb-4 text-sm">
          Bộ bài có tổng cộng <b>{selectedSet?.questions?.length || 0}</b> câu hỏi.
        </p>

        <div className="flex flex-col gap-3">
          {repairModes.map((mode) => {
            const totalQ = selectedSet?.questions?.length || 0;
            // Tính số câu làm tròn lên, ít nhất là 1 câu
            const calcCount = Math.min(totalQ, Math.max(1, Math.round((totalQ * mode.percentage) / 100)));

            return (
              <Button
                key={mode.id}
                size="large"
                onClick={() => handleStartWithPercentage(mode.percentage)}
                className="h-14 flex items-center justify-between rounded-xl hover:border-indigo-500 hover:text-indigo-600 transition-all text-left"
              >
                <div className="flex flex-col">
                  <span className="font-bold text-slate-800">{mode.label}</span>
                  
                </div>
                <Tag color="indigo" className="font-bold">
                  {mode.percentage}%
                </Tag>
              </Button>
            );
          })}
        </div>
      </Modal>
    </div>
  );
};

export default RepairList;