// src/components/document/DocumentBody.jsx
import React from 'react';
import { Typography, Alert } from 'antd';

const { Title, Paragraph, Text } = Typography;

const DocumentBody = ({ parts }) => {
  return (
    <div>
      {parts.map((part, index) => (
        <div 
          key={index} 
          id={`part-${index}`} 
          style={{ marginBottom: 50, scrollMarginTop: 80 }} // scrollMarginTop prevents the fixed header (if any) from hiding the title when anchor linked
        >
          <Title level={3} style={{ color: '#1890ff' }}>
            {index + 1}. {part.name}
          </Title>
          
          {part.purpose && (
             <Alert 
               message={<Text strong>Purpose</Text>}
               description={part.purpose}
               type="info"
               style={{ marginBottom: 20 }}
             />
          )}

          <Paragraph style={{ fontSize: '16px', lineHeight: '1.8', whiteSpace: 'pre-wrap' }}>
            {part.description}
          </Paragraph>
        </div>
      ))}
    </div>
  );
};

export default DocumentBody;