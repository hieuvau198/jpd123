// src/components/title/TitleListModal.jsx
import React from 'react';
import { Modal, List, Typography, Tag } from 'antd';
import { Crown } from 'lucide-react';
import titlesData from '../../data/system/titles.json';

const { Text } = Typography;

const TitleListModal = ({ visible, onClose }) => {
  // Generate pretty colors for titles based on their index (ascending rarity)
  const getColors = (index) => {
    const colors = [
  { color: '#ffffff', bg: '#8c8c8c' }, // Noob
  { color: '#ffffff', bg: '#52c41a' }, // Farmer
  { color: '#ffffff', bg: '#1890ff' }, // Warrior
  { color: '#ffffff', bg: '#722ed1' }, // Master
  { color: '#ffffff', bg: '#eb2f96' }, // Hero
  { color: '#ffffff', bg: '#fa541c' }, // King
  { color: '#000000', bg: '#fadb14' }, // Champion
  { color: '#000000', bg: '#faad14' }, // Challenger
  { color: '#ffffff', bg: '#d46b08' }, // Destroyer
  { color: '#ffffff', bg: '#cf1322' }, // Legendary
  { color: '#ffffff', bg: '#a8071a' }, // Touch Grass
  { color: '#ffffff', bg: '#000000' }, // Donald Trump
  { color: '#ffffff', bg: '#222222' }, // Diddy
];
    return colors[index % colors.length];
  };

  return (
    <Modal
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Crown color="#faad14" size={24} />
          <span style={{ fontSize: '20px', fontWeight: 'bold' }}>Rank Titles</span>
        </div>
      }
      open={visible}
      onCancel={onClose}
      footer={null}
      styles={{ body: { padding: '0', maxHeight: '60vh', overflowY: 'auto' } }}
    >
      <List
        dataSource={titlesData}
        renderItem={(item, index) => {
          const { color, bg } = getColors(index);
          return (
            <List.Item style={{ padding: '16px 24px', borderBottom: '1px solid #f0f0f0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                <Text strong style={{ 
                  color: color, 
                  fontSize: '16px',
                  background: bg,
                  padding: '4px 12px',
                  borderRadius: '8px',
                  border: `1px solid ${color}40`
                }}>
                  {item.title}
                </Text>
                <Tag color="blue" style={{ borderRadius: '12px', padding: '4px 10px', fontSize: '13px' }}>
                  Level {item.minLevel} - {item.maxLevel === 999999 ? 'MAX' : item.maxLevel}
                </Tag>
              </div>
            </List.Item>
          );
        }}
      />
    </Modal>
  );
};

export default TitleListModal;