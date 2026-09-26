// src/components/RecentPracticeRecords.jsx
import React, { useState, useEffect } from 'react';
import { Card, Typography, Spin, Button, Empty, Tooltip } from 'antd';
import { History, ChevronLeft, ChevronRight, Clock } from 'lucide-react';
import { getAllHistories } from '../firebase/historyService';
import { getAllUsers } from '../firebase/userService';
import { getRatingInfo } from './flashcard/wordConstants';

const { Title, Text } = Typography;

// Định dạng thời gian tương đối ngắn gọn
const formatTimeAgo = (isoString) => {
  if (!isoString) return '';
  const diff = Date.now() - new Date(isoString).getTime();
  const minutes = Math.floor(diff / (1000 * 60));
  if (minutes < 1) return 'vừa xong';
  if (minutes < 60) return `${minutes}p trước`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h trước`;
  const days = Math.floor(hours / 24);
  return `${days}d trước`;
};

// Rút gọn tên học sinh (Họ + Tên)
const formatStudentName = (fullName) => {
  if (!fullName) return 'Học sinh';
  const parts = fullName.trim().split(/\s+/);
  if (parts.length <= 1) return fullName;
  return `${parts[0]} ${parts[parts.length - 1]}`;
};

const RecentPracticeRecords = () => {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);

  const PAGE_SIZE = 10;
  const MAX_PAGES = 4; // Tối đa 4 trang

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [historiesMap, usersList] = await Promise.all([
          getAllHistories(),
          getAllUsers(),
        ]);

        const userMap = {};
        (usersList || []).forEach((u) => {
          const displayName = u.name || u.username;
          if (u.id) userMap[u.id] = displayName;
          if (u.username) userMap[u.username] = displayName;
        });

        const allRecords = [];
        Object.entries(historiesMap || {}).forEach(([userId, practices]) => {
          const studentName = userMap[userId] || userId || 'Học sinh';

          Object.values(practices || {}).forEach((item) => {
            if (item && item.lastAccessed) {
              allRecords.push({
                key: `${userId}-${item.id}-${item.lastAccessed}`,
                userId,
                studentName,
                practiceName: item.name || item.id || 'Bài luyện tập',
                score: typeof item.completion === 'number' ? item.completion : 0,
                lastAccessed: item.lastAccessed,
              });
            }
          });
        });

        // Sắp xếp bài mới làm nhất lên đầu và lấy tối đa 40 record (4 trang)
        allRecords.sort(
          (a, b) => new Date(b.lastAccessed) - new Date(a.lastAccessed)
        );
        setRecords(allRecords.slice(0, PAGE_SIZE * MAX_PAGES));
      } catch (err) {
        console.error('Lỗi khi tải lịch sử làm bài gần đây:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const totalPages = Math.min(
    MAX_PAGES,
    Math.ceil(records.length / PAGE_SIZE) || 1
  );

  const displayedRecords = records.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  const getScoreBadgeColor = (score) => {
    if (score >= 80) return 'text-emerald-600 bg-emerald-50 border-emerald-300';
    if (score >= 50) return 'text-amber-600 bg-amber-50 border-amber-300';
    return 'text-rose-600 bg-rose-50 border-rose-300';
  };

  return (
    <Card
      style={{
        borderRadius: 20,
        background: 'linear-gradient(145deg, #ffffff, #f7faff)',
        boxShadow: '0 10px 25px rgba(24, 144, 255, 0.12)',
        border: '1px solid #d6e4ff',
      }}
      styles={{ body: { padding: '18px 14px' } }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 14,
          paddingBottom: 10,
          borderBottom: '1px solid #eef2f8',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <History size={20} color="#1890ff" />
          <Title level={4} style={{ margin: 0, color: '#1f1f1f', fontSize: 16 }}>
            Hoạt động gần đây
          </Title>
        </div>
      </div>

      {/* Danh sách row */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '30px 0' }}>
          <Spin size="default" />
          <Text type="secondary" style={{ display: 'block', marginTop: 8, fontSize: 12 }}>
            Đang tải dữ liệu...
          </Text>
        </div>
      ) : displayedRecords.length === 0 ? (
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description="Chưa có dữ liệu làm bài"
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {displayedRecords.map((item) => {
            const rating = getRatingInfo(item.score);

            return (
              <div
                key={item.key}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '8px 10px',
                  borderRadius: 10,
                  backgroundColor: '#ffffff',
                  border: '1px solid #f0f2f7',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
                }}
              >
                {/* Ảnh nhỏ đại diện cấp độ theo Session Result */}
                <Tooltip title={`${rating.title} (${item.score}đ)`}>
                  <img
                    src={rating.img}
                    alt={rating.title}
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: '50%',
                      objectFit: 'cover',
                      flexShrink: 0,
                      border: '1.5px solid #e6f4ff',
                    }}
                  />
                </Tooltip>

                {/* Nội dung gọn gàng, tự co giãn, không scroll ngang */}
                <div
                  style={{
                    flex: 1,
                    minWidth: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 8,
                  }}
                >
                  <div
                    style={{
                      minWidth: 0,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                    }}
                  >
                    <Text
                      strong
                      style={{
                        color: '#1677ff',
                        fontSize: 13,
                        flexShrink: 0,
                      }}
                    >
                      {formatStudentName(item.studentName)}
                    </Text>

                    <Text
                      ellipsis={{ tooltip: item.practiceName }}
                      style={{
                        color: '#262626',
                        fontSize: 13,
                        fontWeight: 500,
                      }}
                    >
                      {item.practiceName}
                    </Text>
                  </div>

                  {/* Điểm và thời gian */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      flexShrink: 0,
                    }}
                  >
                    <span
                      className={`px-2 py-0.5 rounded-md text-xs font-bold border shrink-0 ${getScoreBadgeColor(
                        item.score
                      )}`}
                    >
                      {item.score}%
                    </span>

                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 2,
                        color: '#8c8c8c',
                        fontSize: 11,
                      }}
                    >
                      <Clock size={11} /> {formatTimeAgo(item.lastAccessed)}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Phân trang (tối đa 4 trang) */}
      {!loading && totalPages > 1 && (
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: 10,
            marginTop: 14,
            paddingTop: 10,
            borderTop: '1px solid #f0f2f7',
          }}
        >
          <Button
            size="small"
            shape="circle"
            icon={<ChevronLeft size={15} />}
            onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
          />

          <div style={{ display: 'flex', gap: 5 }}>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                style={{
                  width: 25,
                  height: 25,
                  borderRadius: 6,
                  border:
                    page === currentPage
                      ? '1px solid #1677ff'
                      : '1px solid #d9d9d9',
                  backgroundColor: page === currentPage ? '#1677ff' : '#ffffff',
                  color: page === currentPage ? '#ffffff' : '#595959',
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
              >
                {page}
              </button>
            ))}
          </div>

          <Button
            size="small"
            shape="circle"
            icon={<ChevronRight size={15} />}
            onClick={() =>
              setCurrentPage((prev) => Math.min(totalPages, prev + 1))
            }
            disabled={currentPage === totalPages}
          />
        </div>
      )}
    </Card>
  );
};

export default RecentPracticeRecords;