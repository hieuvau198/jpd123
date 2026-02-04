import React from 'react';
import { ChevronRight, BookOpen, Brain, Tag as TagIcon } from 'lucide-react';
import { Card, Tag, Typography, Flex, Badge } from 'antd';
import SUBJECTS_DATA from '../data/system/subjects.json';
import TAGS_DATA from '../data/system/tags.json';

const { Text, Title } = Typography;

const getTagName = (tagId) => {
  const tag = TAGS_DATA.find(t => t.id === tagId);
  return tag ? tag.name : tagId;
};

const getSubjectName = (subjectId) => {
  const sub = SUBJECTS_DATA.find(s => s.id === subjectId);
  return sub ? sub.name : subjectId;
};

const PracticeCard = ({ practice, onClick }) => {
  return (
    <Card 
      hoverable 
      onClick={() => onClick(practice)}
      size="small"
      style={{ width: '100%', height: '100%' }}
    >
      <Flex justify="space-between" align="center" style={{ marginBottom: 8 }}>
        <Title level={5} style={{ margin: 0 }}>{practice.title}</Title>
        {practice.subject && (
          <Tag color="default">{getSubjectName(practice.subject)}</Tag>
        )}
      </Flex>
      
      <Flex justify="space-between" align="end">
        <Flex vertical gap="4px">
          <Flex align="center" gap="small">
            {practice.type === 'flashcard' ? <BookOpen size={14} /> : <Brain size={14} />}
            <Text type="secondary" style={{ fontSize: '12px' }}>
              {practice.questions ? practice.questions.length : 0} items
            </Text>
          </Flex>

          {practice.tags && practice.tags.length > 0 && (
            <Flex wrap="wrap" gap="4px" style={{ marginTop: 4 }}>
              {practice.tags.map(tagId => (
                <Tag key={tagId} icon={<TagIcon size={10} />} bordered={false} style={{ fontSize: 10, margin: 0 }}>
                  {getTagName(tagId)}
                </Tag>
              ))}
            </Flex>
          )}
        </Flex>
        <ChevronRight size={16} style={{ color: '#ccc' }} />
      </Flex>
    </Card>
  );
};

export default PracticeCard;