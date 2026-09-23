// src/components/admin/Schedule/DefaultSlotManagerModal.jsx
import React, { useState, useEffect } from 'react';
import { Modal, Table, Button, Form, Select, TimePicker, Popconfirm, message, Space } from 'antd';
import { Plus, Trash2, Clock } from 'lucide-react';
import dayjs from 'dayjs';
import { getAllDefaultSlots, saveDefaultSlot, deleteDefaultSlot } from '../../../firebase/slotService';

const DAYS_OF_WEEK = [
  { value: 2, label: 'Thứ 2' },
  { value: 3, label: 'Thứ 3' },
  { value: 4, label: 'Thứ 4' },
  { value: 5, label: 'Thứ 5' },
  { value: 6, label: 'Thứ 6' },
  { value: 7, label: 'Thứ 7' },
  { value: 8, label: 'Chủ Nhật' },
];

const DefaultSlotManagerModal = ({ visible, onClose, onUpdated }) => {
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();

  const fetchSlots = async () => {
    setLoading(true);
    const data = await getAllDefaultSlots(true);
    setSlots(data);
    setLoading(false);
  };

  useEffect(() => {
    if (visible) {
      fetchSlots();
    }
  }, [visible]);

  const handleCreate = async (values) => {
    try {
      const payload = {
        dayOfWeek: values.dayOfWeek,
        startTime: values.timeRange[0].format('HH:mm'),
        endTime: values.timeRange[1].format('HH:mm'),
        title: `Thứ ${values.dayOfWeek === 8 ? 'CN' : values.dayOfWeek} (${values.timeRange[0].format('HH:mm')} - ${values.timeRange[1].format('HH:mm')})`
      };
      await saveDefaultSlot(payload);
      message.success('Đã thêm ca học mặc định!');
      form.resetFields();
      await fetchSlots();
      if (onUpdated) onUpdated();
    } catch (err) {
      message.error('Không thể thêm ca học');
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteDefaultSlot(id);
      message.success('Đã xóa ca học mặc định!');
      await fetchSlots();
      if (onUpdated) onUpdated();
    } catch (err) {
      message.error('Không thể xóa ca học');
    }
  };

  const columns = [
    {
      title: 'Thứ',
      dataIndex: 'dayOfWeek',
      render: (day) => DAYS_OF_WEEK.find((d) => d.value === day)?.label || `Thứ ${day}`,
    },
    {
      title: 'Thời gian',
      key: 'time',
      render: (_, r) => `${r.startTime} - ${r.endTime}`,
    },
    {
      title: 'Thao tác',
      key: 'action',
      width: 80,
      render: (_, r) => (
        <Popconfirm title="Xác nhận xóa ca này?" onConfirm={() => handleDelete(r.id)} okText="Xóa" cancelText="Hủy">
          <Button type="text" danger icon={<Trash2 size={16} />} />
        </Popconfirm>
      ),
    },
  ];

  return (
    <Modal
      title={
        <div className="flex items-center gap-2">
          <Clock size={20} className="text-blue-500" />
          <span>Quản lý Ca Học Mặc Định (Default Slots)</span>
        </div>
      }
      open={visible}
      onCancel={onClose}
      footer={null}
      width={650}
      centered
    >
      <Form form={form} layout="inline" onFinish={handleCreate} className="mb-4">
        <Form.Item name="dayOfWeek" rules={[{ required: true, message: 'Chọn thứ' }]}>
          <Select placeholder="Chọn thứ" style={{ width: 120 }} options={DAYS_OF_WEEK} />
        </Form.Item>
        <Form.Item name="timeRange" rules={[{ required: true, message: 'Chọn giờ' }]}>
          <TimePicker.RangePicker format="HH:mm" minuteStep={5} />
        </Form.Item>
        <Form.Item>
          <Button type="primary" htmlType="submit" icon={<Plus size={16} />}>
            Thêm
          </Button>
        </Form.Item>
      </Form>

      <Table
        dataSource={slots}
        columns={columns}
        rowKey="id"
        loading={loading}
        pagination={false}
        size="small"
      />
    </Modal>
  );
};

export default DefaultSlotManagerModal;