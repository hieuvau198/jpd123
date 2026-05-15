// src/components/document/DocumentHeader.jsx
import React from 'react';
import { Typography, Tag, Divider, Flex } from 'antd';

const { Title } = Typography;

const DocumentHeader = ({ title, subject, tags }) => {
  return (
    <div style={{ marginBottom: 30 }}>
      <Title level={1} style={{ marginBottom: 16 }}>{title}</Title>
      
      <Flex gap="small" wrap="wrap">
        {subject && (
          <Tag color="blue" style={{ fontSize: '14px', padding: '4px 8px' }}>
            {subject}
          </Tag>
        )}
        {tags && tags.map((tag, index) => (
          <Tag key={index} style={{ fontSize: '14px', padding: '4px 8px' }}>
            {tag}
          </Tag>
        ))}
      </Flex>
      <Divider />
    </div>
  );
};

export default DocumentHeader;