// src/components/admin/UserMissionsModal.jsx
import React from 'react';
import { Modal, Table, Button, Tag, Popconfirm, Typography } from 'antd';
import { Edit, Trash2 } from 'lucide-react';
import dayjs from 'dayjs';

const { Text } = Typography;

const UserMissionsModal = ({ 
  visible, onCancel, user, missions, loading, onAssignNew, onEdit, onDelete 
}) => {
  
  const columns = [
  { 
    title: 'Mission Name', 
    dataIndex: 'name', 
    key: 'name', 
    render: (text, record) => (
      <div>
        <Text strong>{text || record.practiceId}</Text>
        <div style={{ marginTop: '4px', display: 'flex', gap: '4px', alignItems: 'center', flexWrap: 'wrap' }}>
          <Tag color="blue" style={{ fontSize: '11px' }}>
            {record.targetQuestions || 0} / {record.totalQuestions || 0}
          </Tag>
          <Tag 
            color={record.status === 'Đã chinh phục' ? 'green' : (record.status === 'Đang làm' ? 'orange' : 'default')}
            style={{ fontSize: '11px' }}
          >
            {record.status}
          </Tag>
        </div>
      </div>
    )
  },
  // Remove the 'Progress (%)' column object entirely from the array
  {
    title: 'Action',
    key: 'action',
    render: (_, record) => (
      <div style={{ display: 'flex', gap: '8px' }}>
        <Button type="text" size="small" icon={<Edit size={14} />} onClick={() => onEdit(record)} />
        <Popconfirm title="Delete this mission?" onConfirm={() => onDelete(record.id)}>
          <Button type="text" danger size="small" icon={<Trash2 size={14} />} />
        </Popconfirm>
      </div>
    ),
  }
];

  return (
    <Modal 
      title={`Missions for ${user?.name}`} 
      open={visible} 
      onCancel={onCancel} 
      width={900}
      footer={null}
    >
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between' }}>
        <Text type="secondary">Manage assignments and track progress.</Text>
        <Button type="primary" onClick={onAssignNew}>Assign New Mission</Button>
      </div>
      <Table columns={columns} dataSource={missions} rowKey="id" loading={loading} size="small" />
    </Modal>
  );
};

export default UserMissionsModal;