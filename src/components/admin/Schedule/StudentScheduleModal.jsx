// src/components/admin/Schedule/StudentScheduleModal.jsx
import React, { useState, useEffect } from 'react';
import {
  Modal,
  Table,
  Button,
  Tag,
  Select,
  DatePicker,
  Popconfirm,
  message,
  Badge,
} from 'antd';
import {
  Calendar,
  Settings,
  Plus,
  Trash2,
  Save,
  Clock,
  RotateCcw,
} from 'lucide-react';
import dayjs from 'dayjs';
import {
  getSlotsByStudentId,
  getAllDefaultSlots,
  syncStudentSlots,
} from '../../../firebase/slotService';
import DefaultSlotManagerModal from './DefaultSlotManagerModal';

const StudentScheduleModal = ({ visible, onClose, student }) => {
  // Dữ liệu từ server và bộ nhớ tạm (draft)
  const [originalSlots, setOriginalSlots] = useState([]);
  const [slots, setSlots] = useState([]);
  const [deletedSlotIds, setDeletedSlotIds] = useState([]);
  const [defaultSlots, setDefaultSlots] = useState([]);

  // States thao tác UI
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [showDefaultSlotModal, setShowDefaultSlotModal] = useState(false);

  // Form input thêm slot nhanh
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedDefaultSlotId, setSelectedDefaultSlotId] = useState(null);

  // 1. Tải dữ liệu ban đầu
  const fetchInitialData = async () => {
    if (!student?.id) return;
    setLoading(true);
    try {
      const [userSlots, dSlots] = await Promise.all([
        getSlotsByStudentId(student.id, true),
        getAllDefaultSlots(),
      ]);
      setOriginalSlots(userSlots);
      setSlots(JSON.parse(JSON.stringify(userSlots)));
      setDefaultSlots(dSlots);
      setDeletedSlotIds([]);
      setHasChanges(false);
    } catch (err) {
      message.error('Không thể tải lịch học');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (visible && student?.id) {
      fetchInitialData();
    }
  }, [visible, student]);

  // 2. Thêm buổi học tạm thời vào danh sách
  const handleAddSlot = () => {
    if (!selectedDate) {
      message.warning('Vui lòng chọn ngày học');
      return;
    }

    const dateStr = selectedDate.format('YYYY-MM-DD');

    // Kiểm tra xem ngày và ca này đã tồn tại trong draft chưa
    const isExisted = slots.some(
      (s) => s.date === dateStr && s.defaultSlotId === (selectedDefaultSlotId || '')
    );
    if (isExisted) {
      message.warning('Buổi học này đã có trong danh sách!');
      return;
    }

    const newDraftSlot = {
      id: `temp_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      studentId: student.id,
      studentName: student.name || student.username,
      date: dateStr,
      defaultSlotId: selectedDefaultSlotId || '',
      status: 'pending',
      isNew: true, // Đánh dấu hàng mới thêm
    };

    setSlots((prev) => [newDraftSlot, ...prev]);
    setHasChanges(true);
    setSelectedDate(null);
    setSelectedDefaultSlotId(null);
    message.info('Đã thêm vào danh sách tạm. Nhấn "Lưu thay đổi" để áp dụng.');
  };

  // 3. Thay đổi trạng thái điểm danh (tạm thời)
  const handleStatusChange = (slotId, newStatus) => {
    setSlots((prev) =>
      prev.map((s) => (s.id === slotId ? { ...s, status: newStatus, isModified: true } : s))
    );
    setHasChanges(true);
  };

  // 4. Xóa buổi học (tạm thời)
  const handleDeleteSlot = (slotId) => {
    // Nếu slot không phải vừa tạo tạm thời thì lưu ID vào danh sách cần xóa trên DB
    if (!slotId.startsWith('temp_')) {
      setDeletedSlotIds((prev) => [...prev, slotId]);
    }
    setSlots((prev) => prev.filter((s) => s.id !== slotId));
    setHasChanges(true);
  };

  // 5. Khôi phục lại trạng thái ban đầu khi chưa bấm Save
  const handleReset = () => {
    setSlots(JSON.parse(JSON.stringify(originalSlots)));
    setDeletedSlotIds([]);
    setHasChanges(false);
    message.info('Đã hoàn tác các thay đổi chưa lưu');
  };

  // 6. Gửi toàn bộ thay đổi cùng lúc lên Firebase (Nút Save)
  const handleSaveChanges = async () => {
    setSaving(true);
    try {
      await syncStudentSlots(student.id, slots, deletedSlotIds);
      message.success('Đã lưu toàn bộ thay đổi lịch học thành công!');
      await fetchInitialData(); // Đồng bộ lại dữ liệu mới nhất
    } catch (err) {
      console.error(err);
      message.error('Có lỗi xảy ra khi lưu lịch học!');
    } finally {
      setSaving(false);
    }
  };

  // 7. Đóng modal (kiểm tra nhắc nhở nếu chưa lưu)
  const handleClose = () => {
    if (hasChanges) {
      Modal.confirm({
        title: 'Bạn có thay đổi chưa lưu!',
        content: 'Các chỉnh sửa buổi học sẽ bị mất nếu bạn đóng mà chưa nhấn "Lưu thay đổi".',
        okText: 'Rời đi',
        cancelText: 'Ở lại',
        okButtonProps: { danger: true },
        onOk: () => {
          setHasChanges(false);
          onClose();
        },
      });
    } else {
      onClose();
    }
  };

  const columns = [
    {
      title: 'Ngày học',
      dataIndex: 'date',
      key: 'date',
      render: (d, record) => (
        <div className="flex items-center gap-2">
          <span className="font-semibold text-slate-800">{d}</span>
          {record.isNew && (
            <Tag color="cyan" style={{ fontSize: 10, padding: '0 4px', margin: 0 }}>
              Mới
            </Tag>
          )}
          {record.isModified && !record.isNew && (
            <Tag color="orange" style={{ fontSize: 10, padding: '0 4px', margin: 0 }}>
              Đã sửa
            </Tag>
          )}
        </div>
      ),
    },
    {
      title: 'Khung giờ',
      key: 'timeSlot',
      render: (_, r) => {
        const found = defaultSlots.find((ds) => ds.id === r.defaultSlotId);
        return found ? (
          <Tag color="geekblue">
            {found.startTime} - {found.endTime}
          </Tag>
        ) : (
          <span className="text-gray-400 text-xs">Tùy chỉnh</span>
        );
      },
    },
    {
      title: 'Trạng thái',
      key: 'status',
      render: (_, r) => (
        <Select
          value={r.status || 'pending'}
          onChange={(val) => handleStatusChange(r.id, val)}
          size="small"
          style={{ width: 140 }}
        >
          <Select.Option value="pending">
            <span className="text-amber-500 font-medium">Chưa diễn ra</span>
          </Select.Option>
          <Select.Option value="present">
            <span className="text-emerald-500 font-medium">Có mặt</span>
          </Select.Option>
          <Select.Option value="absent">
            <span className="text-rose-500 font-medium">Vắng</span>
          </Select.Option>
        </Select>
      ),
    },
    {
      title: '',
      key: 'action',
      width: 60,
      render: (_, r) => (
        <Popconfirm
          title="Xóa buổi học này?"
          description="Buổi học sẽ được đánh dấu xóa cho đến khi bấm Lưu"
          onConfirm={() => handleDeleteSlot(r.id)}
          okText="Xóa"
          cancelText="Hủy"
        >
          <Button type="text" danger icon={<Trash2 size={16} />} />
        </Popconfirm>
      ),
    },
  ];

  return (
    <>
      <Modal
        title={
          <div className="flex flex-wrap justify-between items-center pr-6 gap-2">
            <div className="flex items-center gap-2">
              <Calendar className="text-indigo-600" size={20} />
              <span className="font-bold text-base">
                Lịch học: {student?.name || student?.username}
              </span>
            </div>
            {/* Nút sang giao diện chỉnh sửa default_slots (áp dụng CRUD trực tiếp như cũ) */}
            <Button
              type="dashed"
              icon={<Settings size={15} />}
              onClick={() => setShowDefaultSlotModal(true)}
            >
              Settings
            </Button>
          </div>
        }
        open={visible}
        onCancel={handleClose}
        width={760}
        centered
        footer={
          <div className="flex justify-between items-center py-1">
            <div className="flex items-center gap-2">
              {hasChanges && (
                <Badge status="processing" text={<span className="text-xs text-amber-600 font-medium">Có thay đổi chưa lưu</span>} />
              )}
            </div>
            <div className="flex items-center gap-2">
              {hasChanges && (
                <Button
                  icon={<RotateCcw size={14} />}
                  onClick={handleReset}
                  disabled={saving}
                >
                  Hoàn tác
                </Button>
              )}
              <Button onClick={handleClose} disabled={saving}>
                Đóng
              </Button>
              <Button
                type="primary"
                icon={<Save size={15} />}
                onClick={handleSaveChanges}
                loading={saving}
                disabled={!hasChanges}
                className="bg-indigo-600 hover:bg-indigo-500 font-semibold"
              >
                Save
              </Button>
            </div>
          </div>
        }
      >
        {/* Thanh thêm buổi học nhanh (chỉ thêm vào bộ nhớ tạm) */}
        <div className="flex flex-wrap gap-2 items-center mb-4 p-3 bg-slate-50 rounded-xl border border-slate-100">
          <DatePicker
            placeholder="Date"
            value={selectedDate}
            onChange={(d) => setSelectedDate(d)}
            format="YYYY-MM-DD"
          />
          <Select
            placeholder="Slot"
            allowClear
            style={{ minWidth: 200 }}
            value={selectedDefaultSlotId}
            onChange={(v) => setSelectedDefaultSlotId(v)}
            options={defaultSlots.map((ds) => ({
              value: ds.id,
              label: `Thứ ${ds.dayOfWeek === 8 ? 'CN' : ds.dayOfWeek}: ${ds.startTime} - ${ds.endTime}`,
            }))}
          />
          <Button type="primary" icon={<Plus size={16} />} onClick={handleAddSlot}>
            Add
          </Button>
        </div>

        <Table
          dataSource={slots}
          columns={columns}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 6 }}
          size="middle"
        />
      </Modal>

      {/* Modal chỉnh sửa Default Slot (vẫn giữ cơ chế CRUD trực tiếp, không áp dụng Save theo lô) */}
      <DefaultSlotManagerModal
        visible={showDefaultSlotModal}
        onClose={() => setShowDefaultSlotModal(false)}
        onUpdated={fetchInitialData}
      />
    </>
  );
};

export default StudentScheduleModal;