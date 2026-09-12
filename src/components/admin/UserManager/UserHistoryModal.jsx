// src/components/admin/UserManager/UserHistoryModal.jsx
import React, { useState, useEffect } from 'react';
import { Modal, Table, Tag, Button, Typography, message } from 'antd';
import { History, RotateCcw, Coins } from 'lucide-react';
import { getUserHistory } from '../../../firebase/historyService';

const UserHistoryModal = ({ open, onClose, user }) => {
  const [historyList, setHistoryList] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || !user?.id) {
      setHistoryList([]);
      return;
    }

    const fetchHistory = async () => {
      setLoading(true);
      try {
        const historyMap = await getUserHistory(user.id);
        const list = Object.values(historyMap || {}).sort((a, b) => {
          return new Date(b.lastAccessed || 0) - new Date(a.lastAccessed || 0);
        });
        setHistoryList(list);
      } catch (error) {
        console.error("Lỗi lấy lịch sử bài làm:", error);
        message.error("Không thể tải lịch sử làm bài của học viên");
        setHistoryList([]);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [open, user]);

  const columns = [
    {
      title: 'Tên bài tập',
      key: 'name',
      render: (_, item) => (
        <div>
          <div style={{ fontWeight: 600, color: '#262626' }}>{item.name || item.id}</div>
          <div style={{ display: 'flex', gap: 6, marginTop: 4, alignItems: 'center' }}>
            <Tag color="cyan">{item.type || 'Practice'}</Tag>
            <span style={{ fontSize: 12, color: '#8c8c8c', display: 'inline-flex', alignItems: 'center', gap: 3 }}>
              <RotateCcw size={12} /> {item.attempts || 1} lần làm
            </span>
          </div>
        </div>
      ),
    },
    {
      title: 'Điểm cao nhất',
      dataIndex: 'completion',
      key: 'completion',
      align: 'center',
      render: (score) => {
        const val = score || 0;
        const color = val >= 80 ? '#52c41a' : val >= 50 ? '#fa8c16' : '#ff4d4f';
        return <span style={{ color, fontWeight: 'bold' }}>{val}%</span>;
      },
    },
    {
      title: 'Coin nhận',
      dataIndex: 'earnedCoins',
      key: 'earnedCoins',
      align: 'center',
      render: (coins) => (
        <span style={{ color: '#faad14', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 3 }}>
          <Coins size={13} /> +{coins || 0}
        </span>
      ),
    },
    {
      title: 'Lần cuối làm',
      dataIndex: 'lastAccessed',
      key: 'lastAccessed',
      render: (dateStr) => (dateStr ? new Date(dateStr).toLocaleString('vi-VN') : '-'),
    },
  ];

  return (
    <Modal
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <History size={20} color="#1890ff" />
          <span>Lịch sử bài làm: <strong>{user?.name || user?.username}</strong></span>
          <Tag color="blue" style={{ fontSize: 13, padding: '2px 8px' }}>
            Tổng số bài: {historyList.length}
          </Tag>
        </div>
      }
      open={open}
      onCancel={onClose}
      footer={[
        <Button key="close" type="primary" onClick={onClose}>
          Đóng
        </Button>,
      ]}
      width={800}
    >
      <div
        style={{
          marginBottom: 16,
          padding: '10px 14px',
          background: '#f6ffed',
          border: '1px solid #b7eb8f',
          borderRadius: 8,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 8,
        }}
      >
        <span>
          📌 <strong>Ghi chú:</strong> Học viên đã hoàn thành / luyện tập <strong>{historyList.length}</strong> bài tập khác nhau.
        </span>
        <span style={{ color: '#52c41a', fontWeight: 600 }}>
          Tổng số lần làm: {historyList.reduce((sum, item) => sum + (item.attempts || 1), 0)} lượt
        </span>
      </div>

      <Table
        dataSource={historyList}
        columns={columns}
        rowKey="id"
        loading={loading}
        pagination={{ pageSize: 6, size: 'small' }}
        locale={{ emptyText: 'Học viên chưa làm bài tập nào.' }}
        scroll={{ x: true }}
      />
    </Modal>
  );
};

export default UserHistoryModal;