// src/components/admin/UserManager/UserFilter.jsx
import React from 'react';
import { Card, Input, Tag, Button, Select } from 'antd';
import { Search } from 'lucide-react';

const { CheckableTag } = Tag;

const UserFilter = ({
  searchText,
  setSearchText,
  selectedGrades,
  setSelectedGrades,
  sortBy,
  setSortBy,
  gradesData
}) => {
  const handleGradeToggle = (grade, checked) => {
    let nextSelectedTags;
    if (grade === 'All') {
      nextSelectedTags = checked ? ['All'] : [];
    } else {
      nextSelectedTags = checked
        ? [...selectedGrades.filter(g => g !== 'All'), grade]
        : selectedGrades.filter((t) => t !== grade);
    }
    setSelectedGrades(nextSelectedTags);
  };

  return (
    <Card style={{ marginBottom: 20 }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        
        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
          {/* Search Bar */}
          <Input 
            prefix={<Search size={16} style={{ color: '#bfbfbf' }} />}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            allowClear
            style={{ maxWidth: 400, flex: 1 }}
          />

          {/* Sort Dropdown */}
          <Select 
            value={sortBy} 
            onChange={setSortBy} 
            style={{ width: 180 }}
            options={[
              { value: 'date', label: 'Date' },
              { value: 'name', label: 'Name' },
              { value: 'coin', label: 'Rank' },
            ]}
          />
        </div>

        {/* Grade Tags Filter */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <CheckableTag
            key="All"
            checked={selectedGrades.includes('All')}
            onChange={(checked) => handleGradeToggle('All', checked)}
            style={{
              border: '1px solid #d9d9d9',
              padding: '4px 12px',
              borderRadius: '16px',
              fontSize: '14px'
            }}
          >
            All
          </CheckableTag>

          {gradesData.map((grade) => (
            <CheckableTag
              key={grade}
              checked={selectedGrades.includes(grade)}
              onChange={(checked) => handleGradeToggle(grade, checked)}
              style={{
                border: '1px solid #d9d9d9',
                padding: '4px 12px',
                borderRadius: '16px',
                fontSize: '14px'
              }}
            >
              {grade}
            </CheckableTag>
          ))}
          
          {/* Clear Filters Button */}
          {selectedGrades.length > 0 && (
            <Button type="link" size="small" onClick={() => setSelectedGrades([])}>
              Clear
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
};

export default UserFilter;