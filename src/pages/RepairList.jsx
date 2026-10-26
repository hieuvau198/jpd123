// src/pages/RepairList.jsx
import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, Button, Spin, Typography, Row, Col, Tag, Space } from 'antd';
import { Wrench, ArrowLeft, Filter } from 'lucide-react';
import { getAllRepairs } from '../firebase/repairService';
import availableTags from '../data/system/tags.json';
import RepairModeModal from '../components/repair/RepairModeModal';

const { Title } = Typography;
const { CheckableTag } = Tag;

const RepairList = () => {
  const [repairs, setRepairs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSet, setSelectedSet] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  // MẶC ĐỊNH LÀ KHÔNG CHỌN GÌ HẾT (null)
  const selectedTag = searchParams.get('tag') || null;

  useEffect(() => {
    const fetchRepairs = async () => {
      const data = await getAllRepairs();
      setRepairs(data || []);
      setLoading(false);
    };
    fetchRepairs();
  }, []);

  const handleTagChange = (tagId) => {
    if (tagId === null || tagId === selectedTag) {
      setSearchParams({});
    } else {
      setSearchParams({ tag: tagId });
    }
  };

  const filteredRepairs = !selectedTag
    ? [] // Nếu không chọn tag gì thì không load danh sách
    : selectedTag === 'all'
    ? repairs
    : repairs.filter((item) => item.tags && item.tags.includes(selectedTag));

  const handleOpenModeSelect = (set) => {
    setSelectedSet(set);
    setIsModalOpen(true);
  };

  const handleStartWithPercentage = (percentage) => {
    if (!selectedSet) return;
    setIsModalOpen(false);
    // Lưu kèm tag hiện tại để khi quay lại vẫn giữ đúng tag
    const tagQuery = selectedTag ? `&tag=${encodeURIComponent(selectedTag)}` : '';
    navigate(`/repair/${selectedSet.id}?percent=${percentage}${tagQuery}`);
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
      

      <div style={{ textAlign: 'center', marginBottom: 40 }}>
        <Title level={2}>
          <Wrench style={{ verticalAlign: 'middle', marginRight: 10 }} color="#722ed1" />
          Sắp Xếp Câu
        </Title>

        {/* Filter Section */}
        <div style={{ marginTop: 24 }}>
          <Space wrap size={[8, 8]} justify="center" align="center">
            <span style={{ display: 'flex', alignItems: 'center', marginRight: 8, fontWeight: 500 }}>
              <Filter size={16} style={{ marginRight: 6 }} /> Filter by:
            </span>
            <CheckableTag
              checked={selectedTag === 'all'}
              onChange={() => handleTagChange(selectedTag === 'all' ? null : 'all')}
              style={{ border: '1px solid #d9d9d9', padding: '4px 12px', fontSize: '14px', cursor: 'pointer' }}
            >
              All
            </CheckableTag>
            {availableTags.map((tag) => (
              <CheckableTag
                key={tag.id}
                checked={selectedTag === tag.id}
                onChange={() => handleTagChange(tag.id)}
                style={{ border: '1px solid #d9d9d9', padding: '4px 12px', fontSize: '14px', cursor: 'pointer' }}
              >
                {tag.name}
              </CheckableTag>
            ))}
          </Space>
        </div>
      </div>

      {!selectedTag ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: 'rgba(255,255,255,0.7)', fontSize: '16px' }}>
          Vui lòng chọn một tag phân loại ở trên để tải danh sách bài tập.
        </div>
      ) : (
        <Row gutter={[16, 16]}>
          {filteredRepairs.length > 0 ? (
            filteredRepairs.map((set) => (
              <Col xs={24} sm={12} md={8} key={set.id}>
                <div onClick={() => handleOpenModeSelect(set)} style={{ cursor: 'pointer', height: '100%' }}>
                  <Card hoverable style={{ height: '100%', borderRadius: 12, borderTop: '4px solid #722ed1' }}>
                    <Title level={4}>{set.title}</Title>
                    <div style={{ marginBottom: 12 }}>
                      <Tag color="purple">{set.questions?.length || 0} Questions</Tag>
                    </div>
                    <div>
                      {set.subject && <Tag color="blue">{set.subject}</Tag>}
                      {set.tags && set.tags.map((t, idx) => (
                        <Tag key={idx} color="cyan">{t}</Tag>
                      ))}
                    </div>
                  </Card>
                </div>
              </Col>
            ))
          ) : (
            <Col span={24}>
              <div style={{ textAlign: 'center', padding: '40px 0', color: '#999', fontSize: '16px' }}>
                Không tìm thấy bài tập nào cho mục này.
              </div>
            </Col>
          )}
        </Row>
      )}

      <RepairModeModal
        isOpen={isModalOpen}
        set={selectedSet}
        onClose={() => setIsModalOpen(false)}
        onSelectMode={handleStartWithPercentage}
      />
    </div>
  );
};

export default RepairList;