// src/components/profile/ProfileSchedule.jsx
import React, { useEffect, useState } from 'react';
import { Card, Tag, Typography, Spin, Empty, Badge } from 'antd';
import { Calendar as CalendarIcon, Clock } from 'lucide-react';
import dayjs from 'dayjs';
import { getSlotsByStudentId, getAllDefaultSlots } from '../../firebase/slotService';

const { Text } = Typography;

const STATUS_CONFIG = {
  present: {
    label: 'Có mặt',
    color: 'success',
    bg: '#f6ffed',
    border: '#b7eb8f',
  },
  absent: {
    label: 'Vắng',
    color: 'error',
    bg: '#fff2f0',
    border: '#ffccc7',
  },
  pending: {
    label: 'Chưa diễn ra',
    color: 'warning',
    bg: '#fffbe6',
    border: '#ffe58f',
  },
};

const ProfileSchedule = ({ user }) => {
  const [scheduleList, setScheduleList] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    const fetchSchedule = async () => {
      const studentId = user?.id || user?.username;
      if (!studentId) {
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const [studentSlots, defaultSlots] = await Promise.all([
          getSlotsByStudentId(studentId),
          getAllDefaultSlots(),
        ]);

        if (!active) return;

        const defaultSlotsMap = (defaultSlots || []).reduce((acc, slot) => {
          acc[slot.id] = slot;
          return acc;
        }, {});

        const merged = (studentSlots || []).map((item) => {
          const ds = defaultSlotsMap[item.defaultSlotId];
          return {
            ...item,
            timeRange: ds ? `${ds.startTime} - ${ds.endTime}` : null,
            dayOfWeek: ds?.dayOfWeek,
          };
        });

        // Sắp xếp ngày học mới nhất trước
        merged.sort((a, b) => (b.date || '').localeCompare(a.date || ''));
        setScheduleList(merged);
      } catch (err) {
        console.error('Lỗi khi tải lịch học cá nhân:', err);
      } finally {
        if (active) setLoading(false);
      }
    };

    fetchSchedule();

    return () => {
      active = false;
    };
  }, [user?.id, user?.username]);

  const renderContent = () => {
    if (loading) {
      return (
        <div style={{ textAlign: 'center', padding: '20px 0' }}>
          <Spin size="small" />
          <div style={{ fontSize: 12, color: '#8c8c8c', marginTop: 8 }}>Đang tải lịch học...</div>
        </div>
      );
    }

    if (!scheduleList.length) {
      return (
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description={<span style={{ color: '#8c8c8c', fontSize: 13 }}>Hiện chưa có buổi học nào.</span>}
          style={{ margin: '12px 0' }}
        />
      );
    }

    return (
      <div
        style={{
          display: 'grid',
          // minmax(0, 1fr) trên mobile hẹp để không bao giờ tràn ngang
          gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 200px), 1fr))',
          gap: '10px',
          width: '100%',
          boxSizing: 'border-box'
        }}
      >
        {scheduleList.map((slot) => {
          const cfg = STATUS_CONFIG[slot.status] || STATUS_CONFIG.pending;
          const parsedDate = slot.date ? dayjs(slot.date) : null;
          const formattedDate = parsedDate && parsedDate.isValid() ? parsedDate.format('DD/MM/YYYY') : slot.date;
          const dayName = parsedDate && parsedDate.isValid()
            ? (parsedDate.day() === 0 ? 'Chủ Nhật' : `Thứ ${parsedDate.day() + 1}`)
            : '';

          return (
            <div
              key={slot.id}
              style={{
                borderRadius: 10,
                border: `1px solid ${cfg.border}`,
                backgroundColor: cfg.bg,
                padding: '10px 12px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                gap: 6,
                minWidth: 0,
                boxSizing: 'border-box',
                wordBreak: 'break-word'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 6 }}>
                <div style={{ minWidth: 0 }}>
                  <Text strong style={{ fontSize: '13px', color: '#1f1f1f', display: 'block', lineHeight: 1.3 }}>
                    {formattedDate}
                  </Text>
                  {dayName && (
                    <Text type="secondary" style={{ fontSize: 11, display: 'block' }}>
                      {dayName}
                    </Text>
                  )}
                </div>
                <Tag color={cfg.color} style={{ margin: 0, fontSize: 11, lineHeight: '18px', padding: '0 6px', flexShrink: 0 }}>
                  {cfg.label}
                </Tag>
              </div>

              {slot.timeRange ? (
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, color: '#595959', fontSize: 12 }}>
                  <Clock size={12} color="#1890ff" style={{ flexShrink: 0 }} />
                  <span style={{ whiteSpace: 'nowrap' }}>{slot.timeRange}</span>
                </div>
              ) : (
                <div style={{ fontSize: 11, color: '#8c8c8c' }}>Giờ linh hoạt</div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <Card
      title={
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', flexWrap: 'wrap', gap: 4 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <CalendarIcon size={18} color="#722ed1" />
            <span style={{ fontSize: 'clamp(14px, 3.5vw, 16px)', fontWeight: 600 }}>
              Lịch Học Của Bạn
            </span>
          </div>
          {scheduleList.length > 0 && (
            <Badge
              count={scheduleList.length}
              style={{ backgroundColor: '#722ed1', fontSize: 11 }}
              overflowCount={99}
            />
          )}
        </div>
      }
      style={{
        width: '100%',
        maxWidth: '100%',
        borderRadius: 12,
        boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
        boxSizing: 'border-box'
      }}
      styles={{ body: { padding: '12px 14px' } }}
    >
      {renderContent()}
    </Card>
  );
};

export default ProfileSchedule;