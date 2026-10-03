// src/pages/ReadingList.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Typography, Row, Col } from 'antd';
import { BookOpen, Filter, Loader2, Home } from 'lucide-react';
import { getReadingsByTag, getAllReadings } from '../firebase/readingService';
import { getUserHistory } from '../firebase/historyService'; 
import PracticeCard from '../components/PracticeCard'; 
import readingTags from '../data/system/reading_tags.json';

const { Title, Text } = Typography; 

const ReadingList = () => {
  const navigate = useNavigate(); 
  const [searchParams, setSearchParams] = useSearchParams();

  // Pick selected tag ID from URL or default to 'all'
  const selectedTag = searchParams.get('tag') || 'all';

  const [readings, setReadings] = useState([]); 
  const [userHistory, setUserHistory] = useState({});
  const [loading, setLoading] = useState(false); 

  // 1. Fetch User History for progress badges
  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const storedUser = JSON.parse(localStorage.getItem('userSession') || '{}');
        if (storedUser?.id) {
          const historyMap = await getUserHistory(storedUser.id);
          setUserHistory(historyMap || {});
        }
      } catch (err) {
        console.error("Failed to load user history in ReadingList:", err);
      }
    };
    fetchHistory();
  }, []);

  // 2. Fetch Readings according to the active tag
  useEffect(() => {
    const fetchReadings = async () => {
      setLoading(true); 
      try {
        let data = [];
        if (selectedTag === 'all') {
          data = await getAllReadings(); 
        } else {
          data = await getReadingsByTag(selectedTag);
        }

        // Natural sort by title / id
        const sorted = [...(data || [])].sort((a, b) => {
          const textA = a.title || a.id || '';
          const textB = b.title || b.id || '';
          return textA.localeCompare(textB, undefined, { numeric: true, sensitivity: 'base' });
        });

        setReadings(sorted); 
      } catch (err) {
        console.error("Error loading readings:", err); 
        setReadings([]);
      } finally {
        setLoading(false); 
      }
    };

    fetchReadings();
  }, [selectedTag]);

  return (
    <div className="mt-8 min-h-screen p-4 sm:p-8 max-w-7xl mx-auto">
      {/* Header Section */}
      <div className="flex flex-col gap-6 mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            
            <div className="flex items-center gap-3">
              <BookOpen size={36} className="text-amber-300" /> 
              <div>
                <Title level={2} style={{ color: '#fff', margin: 0 }}> 
                  Reading
                </Title>
                
              </div>
            </div>
          </div>
        </div>

        {/* Tag Filter Bar */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 text-white/80 mr-2">
            <Filter size={18} />
            <span className="text-sm font-medium">Tags:</span>
          </div>

          <button
            onClick={() => setSearchParams({ tag: 'all' })}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
              selectedTag === 'all'
                ? 'bg-amber-400 text-black shadow-lg scale-105 font-bold'
                : 'bg-white/10 text-white hover:bg-white/20'
            }`}
          >
            All
          </button>

          {readingTags.map((tag) => {
            const isSelected = selectedTag.toLowerCase() === tag.id.toLowerCase();
            return (
              <button
                key={tag.id}
                onClick={() => setSearchParams({ tag: tag.id })}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                  isSelected
                    ? 'bg-amber-400 text-black shadow-lg scale-105 font-bold'
                    : 'bg-white/10 text-white hover:bg-white/20'
                }`}
              >
                {tag.name}
              </button>
            );
          })}
        </div>
      </div>

      {/* Content Grid */}
      {loading ? ( 
        <div className="flex justify-center items-center h-64"> 
          <Loader2 className="w-12 h-12 text-white animate-spin opacity-80" />
        </div>
      ) : readings.length === 0 ? ( 
        <div className="bg-white/90 rounded-2xl p-12 text-center max-w-md mx-auto shadow-lg"> 
          <Title level={4}>Trình của bạn đã đủ để làm cấp độ này chưa?</Title> 
          <Text type="secondary"> 
            Chưa có bài, hãy inb Admin thêm bài
          </Text>
        </div>
      ) : (
        <Row gutter={[20, 20]}> 
          {readings.map((item) => ( 
            <Col xs={24} sm={12} lg={8} key={item.id}> 
              <PracticeCard 
                practice={item} 
                userProgress={userHistory[item.id]}
                onClick={() => navigate(`/reading/${item.id}${selectedTag ? `?tag=${selectedTag}` : ''}`)} 
              />
            </Col>
          ))}
        </Row>
      )}
    </div>
  );
};

export default ReadingList;