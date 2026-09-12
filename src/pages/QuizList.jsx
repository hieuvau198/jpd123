// src/pages/QuizList.jsx
import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Loader2, Library, Filter } from 'lucide-react';
import { getQuizzesByTag } from '../firebase/quizService';
import { getUserHistory } from '../firebase/historyService';
import PracticeCard from '../components/PracticeCard';
import availableTags from '../data/system/tags.json';

const QuizList = () => {
  const [data, setData] = useState([]);
  const [userHistory, setUserHistory] = useState({});
  const [loading, setLoading] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  
  // Default tag is 'english-core' if no tag is specified in URL params
  const selectedTag = searchParams.get('tag') || 'english-core';
  const navigate = useNavigate();

  // 1. Tải lịch sử làm bài của User hiện tại
  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const storedUser = JSON.parse(localStorage.getItem('userSession') || '{}');
        if (storedUser?.id) {
          const historyMap = await getUserHistory(storedUser.id);
          setUserHistory(historyMap || {});
        }
      } catch (err) {
        console.error("Failed to load user history in QuizList:", err);
      }
    };
    fetchHistory();
  }, []);

  // 2. Tải danh sách bài trắc nghiệm / Grammar theo tag
  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      try {
        const res = await getQuizzesByTag(selectedTag);
        // Natural numerical sort by title (or fallback to id) matching WordList
        const sortedRes = [...(res || [])].sort((a, b) => {
          const textA = a.id || a.title || '';
          const textB = b.id || b.title || '';
          return textA.localeCompare(textB, undefined, { numeric: true, sensitivity: 'base' });
        });
        setData(sortedRes);
      } catch (error) {
        console.error("Error fetching quizzes:", error);
        setData([]);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [selectedTag]);

  return (
    <div className="min-h-screen p-4 sm:p-8 max-w-7xl mx-auto">
      {/* Header Section */}
      <div className="flex flex-col gap-6 mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="mt-8 text-3xl sm:text-4xl font-bold text-white drop-shadow-md flex items-center gap-3">
              <Library className="text-yellow-300" />
              Grammar
            </h2>
          </div>
        </div>

        {/* Tag Filter Area */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 text-white/80 mr-2">
            <Filter size={18} />
            <span className="text-sm font-medium">Bậc:</span>
          </div>
          {availableTags.map((tag) => (
            <button
              key={tag.id}
              onClick={() => setSearchParams({ tag: tag.id })}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all
                ${selectedTag === tag.id
                  ? 'bg-yellow-400 text-black shadow-lg scale-105'
                  : 'bg-white/10 text-white hover:bg-white/20'}`}
            >
              {tag.name}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="w-12 h-12 text-white animate-spin opacity-80" />
        </div>
      ) : !selectedTag ? (
        <div className="flex justify-center items-center h-64 text-white/60 text-lg">
          Please select a category above to load quizzes.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {data.length > 0 ? (
            data.map((item) => (
              <PracticeCard
                key={item.id}
                practice={item}
                userProgress={userHistory[item.id]}
                onClick={() => navigate(`/quiz/${item.id}${selectedTag ? `?tag=${selectedTag}` : ''}`)}
              />
            ))
          ) : (
            <div className="col-span-full text-center py-12 text-white/60">
              No quizzes found for this category.
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default QuizList;