// src/components/document/DocumentTOC.jsx
import React from 'react';
import { Typography, Card, List } from 'antd';
import { List as ListIcon } from 'lucide-react';

const { Title, Text } = Typography;

const DocumentTOC = ({ parts }) => {
  return (
    <Card 
      style={{ marginBottom: 40, backgroundColor: '#fafafa' }} 
      bodyStyle={{ padding: '20px' }}
    >
      <Title level={4} style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 0 }}>
        <ListIcon size={20} color="#1890ff" />
        Table of Contents
      </Title>
      <List
        size="small"
        split={false}
        dataSource={parts}
        renderItem={(part, index) => (
          <List.Item style={{ padding: '4px 0' }}>
             <a href={`#part-${index}`} style={{ fontSize: '16px', color: '#434343' }}>
               {index + 1}. {part.name}
             </a>
          </List.Item>
        )}
      />
    </Card>
  );
};

export default DocumentTOC;