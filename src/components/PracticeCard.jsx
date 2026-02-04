import React from 'react';
import { ChevronRight, BookOpen, Brain, Tag } from 'lucide-react';
import SUBJECTS_DATA from '../data/system/subjects.json';
import TAGS_DATA from '../data/system/tags.json';

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
    <button
      onClick={() => onClick(practice)}
      className="practice-card group"
      style={{ width: '100%', textAlign: 'left', cursor: 'pointer' }}
    >
      <div style={{width: '100%'}}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
           <h3 style={{ margin: 0 }}>{practice.title}</h3>
           {practice.subject && (
             <span className="subject-badge">{getSubjectName(practice.subject)}</span>
           )}
        </div>
        
        <div className="card-meta">
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                 {practice.type === 'flashcard' ? <BookOpen size={14} /> : <Brain size={14} />}
                 <span className="tag-count">
                    {practice.questions ? practice.questions.length : 0}
                 </span>
            </div>

            {practice.tags && practice.tags.length > 0 && (
                <div className="tags-list">
                    {practice.tags.map(tagId => (
                        <span key={tagId} className="tag-pill">
                            <Tag size={10} style={{marginRight:3}}/>
                            {getTagName(tagId)}
                        </span>
                    ))}
                </div>
            )}
        </div>
      </div>
      <ChevronRight size={18} style={{marginLeft: '10px', opacity: 0.5}} />
    </button>
  );
};

export default PracticeCard;