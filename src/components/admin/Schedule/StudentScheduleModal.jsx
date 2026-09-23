// src/components/admin/Schedule/StudentScheduleModal.jsx
import React, { useState, useEffect } from 'react';
import { Modal, Table, Button, Tag, Select, DatePicker, Popconfirm, message, Space } from 'antd';
import { Calendar, Settings, Plus, Trash2, CheckCircle2, XCircle, Clock } from 'lucide-react';
import dayjs from 'dayjs';
import {
  getSlotsByStudentId,
  getAllDefaultSlots,
  saveStudentSlot,
  deleteStudentSlot,
} from '../../../firebase/slotService';
import DefaultSlotManagerModal from './DefaultSlotManagerModal';

const StudentScheduleModal = ({ visible, onClose, student }) => {
  const [slots, setSlots] = useState([]);
  const [defaultSlots, setDefaultSlots] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showDefaultSlotModal, setShowDefaultSlotModal] = useState(false);

  // Form states để thêm buổi học mới
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedDefaultSlotId, setSelectedDefaultSlotId] = useState(null);

  const fetchStudentSlots = async () => {
    if (!student?.id) return;
    setLoading(true);
    const [userSlots, dSlots] = await Promise.all([
      getSlotsByStudentId(student.id, true),
      getAllDefaultSlots(),
    ]);
    setSlots(userSlots);
    setDefaultSlots(dSlots);
    setLoading(false);
  };

  useEffect(() => {
    if (visible && student?.id) {
      fetchStudentSlots();
    }
  }, [visible, student]);

  const handleAddSlot = async () => {
    if (!selectedDate) {
      message.warning('Vui lòng chọn ngày học');
      return;
    }
    try {
      await saveStudentSlot({
        studentId: student.id,
        studentName: student.name || student.username,
        date: selectedDate.format('YYYY-MM-DD'),
        defaultSlotId: selectedDefaultSlotId || '',
        status: 'pending',
      });
      message.success('Đã thêm buổi học!');
      setSelectedDate(null);
      setSelectedDefaultSlotId(null);
      fetchStudentSlots();
    } catch (err) {
      message.error('Không thể thêm buổi học');
    }
  };

  const handleUpdateStatus = async (slot, newStatus) => {
    try {
      await saveStudentSlot({
        ...slot,
        status: newStatus,
      });
      setSlots((prev) =>
        prev.map((s) => (s.id === slot.id ? { ...s, status: newStatus } : s))
      );
      message.success('Đã cập nhật trạng thái');
    } catch (err) {
      message.error('Lỗi khi cập nhật trạng thái');
    }
  };

  const handleDeleteSlot = async (id) => {
    try {
      await deleteStudentSlot(id);
      message.success('Đã xóa buổi học');
      fetchStudentSlots();
    } catch (err) {
      message.error('Không thể xóa');
    }
  };

  const columns = [
    {
      title: 'Ngày học',
      dataIndex: 'date',
      key: 'date',
      render: (d) => <span className="font-semibold">{d}</span>,
    },
    {
      title: 'Khung giờ',
      key: 'timeSlot',
      render: (_, r) => {
        const found = defaultSlots.find((ds) => ds.id === r.defaultSlotId);
        return found ? (
          <Tag color="cyan">
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
      render: (_, r) => {
        return (
          <Select
            value={r.status || 'pending'}
            onChange={(val) => handleUpdateStatus(r, val)}
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
        );
      },
    },
    {
      title: '',
      key: 'action',
      width: 60,
      render: (_, r) => (
        <Popconfirm
          title="Xóa buổi học này?"
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
          <div className="flex justify-between items-center pr-8">
            <div className="flex items-center gap-2">
              <Calendar className="text-indigo-600" size={20} />
              <span>Lịch học: {student?.name || student?.username}</span>
            </div>
            {/* Nút chuyển sang cấu hình Default Slot */}
            <Button
              type="dashed"
              icon={<Settings size={15} />}
              onClick={() => setShowDefaultSlotModal(true)}
            >
              Setting
            </Button>
          </div>
        }
        open={visible}
        onCancel={onClose}
        footer={null}
        width={750}
        centered
      >
        {/* Thanh thêm buổi học nhanh */}
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

      {/* Modal chỉnh sửa Default Slot */}
      <DefaultSlotManagerModal
        visible={showDefaultSlotModal}
        onClose={() => setShowDefaultSlotModal(false)}
        onUpdated={fetchStudentSlots}
      />
    </>
  );
};

export default StudentScheduleModal;