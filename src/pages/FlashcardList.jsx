// src/pages/FlashcardList.jsx
import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Home, Loader2, Layers, Filter } from 'lucide-react';
import { getFlashcardsByTag } from '../firebase/flashcardService'; 
import PracticeCard from '../components/PracticeCard';
import availableTags from '../data/system/tags.json';

const FlashcardList = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false); 

  const [searchParams, setSearchParams] = useSearchParams();
  const selectedTag = searchParams.get('tag');
  const navigate = useNavigate();

  useEffect(() => {
    const fetch = async () => {
      if (!selectedTag) {
        setData([]); 
        return;
      }
      
      setLoading(true);
      const res = await getFlashcardsByTag(selectedTag);

      // Natural numerical sort by title (or fallback to id)
      const sortedRes = [...(res || [])].sort((a, b) => {
        const textA = a.title || a.id || '';
        const textB = b.title || b.id || '';
        return textA.localeCompare(textB, undefined, { numeric: true, sensitivity: 'base' });
      });

      setData(sortedRes);
      setLoading(false);
    };
    fetch();
  }, [selectedTag]);

  return (
    <div className="mt-12 min-h-screen p-4 sm:p-8 max-w-7xl mx-auto">
      {/* Header Section */}
      <div className="flex flex-col gap-6 mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>             
            <h2 className="text-3xl sm:text-4xl font-bold text-white drop-shadow-md flex items-center gap-3">
              <Layers className="text-yellow-300" />
              Words Library
            </h2>
          </div>
        </div>
        {/* Tag Filter Bar */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">          
          {availableTags.map((tag) => (
            <button
              key={tag.id}
              onClick={() => setSearchParams({ tag: tag.id })}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all whitespace-nowrap
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
          Please select a tag above to load flashcards.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {data.length > 0 ? (
            data.map((item) => (
              <PracticeCard
                key={item.id}
                practice={item}
                onClick={() => navigate(`/flashcard/${item.id}${selectedTag ? `?tag=${selectedTag}` : ''}`)}
              />
            ))
          ) : (
            <div className="col-span-full text-center py-12 text-white/60">
              No flashcards found for this category.
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default FlashcardList;