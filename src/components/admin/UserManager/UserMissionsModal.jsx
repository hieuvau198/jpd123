import React from 'react';
import { Modal, Table, Button, Tag, Popconfirm, Typography, Progress } from 'antd';
import { Edit, Trash2 } from 'lucide-react';
import RecalculateCoinsButton from './RecalculateCoinsButton'; // <-- Import the new component

const { Text } = Typography;

const UserMissionsModal = ({ 
  visible, onCancel, user, missions, loading, onAssignNew, onEdit, onDelete, onRefresh 
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
          
          {/* Restored Progress Display */}
          <Tag color="blue" style={{ fontSize: '11px' }}>
            Progress: {Math.round(record.percentage || 0)}%
          </Tag>

          {/* Fixed properties: earningCoin and maxCoin (Not earning_coins) */}
          <Tag color="gold" style={{ fontSize: '11px' }}>
            💰 {record.earning_coins || 0} / {record.max_coins || 0}
          </Tag>
          
          <Tag 
            color={record.status === 'Đã chinh phục' ? 'green' : (record.status === 'Đang làm' || record.status === 'Đang thực hiện' ? 'orange' : 'default')}
            style={{ fontSize: '11px' }}
          >
            {record.status}
          </Tag>
        </div>
      </div>
    )
  },
  {
    title: 'Progress',
    key: 'progress',
    width: 150,
    render: (_, record) => (
      <Progress percent={Math.round(record.percentage || 0)} size="small" />
    )
  },
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
      title={`${user?.name}`} 
      open={visible} 
      onCancel={onCancel} 
      width={900}
      footer={null}
    >
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', gap: '8px' }}>
          {/* Add the Recalculate button here */}
          <RecalculateCoinsButton 
            missions={missions} 
            onRefresh={onRefresh} 
          />
          <Button type="primary" onClick={onAssignNew}>New</Button>
        </div>
      </div>
      <Table columns={columns} dataSource={missions} rowKey="id" loading={loading} size="small" />
    </Modal>
  );
};

export default UserMissionsModal;