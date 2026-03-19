import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Home, Loader2, Library, Filter } from 'lucide-react';

// Make sure this matches your actual export in otherQuizService.js
import { getOtherQuizzesByTag } from '../firebase/otherQuizService'; 
import PracticeCard from '../components/PracticeCard';

// Import the new tags
import availableTags from '../data/system/other_tags.json'; 

const OtherQuizList = () => {
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
      // Ensure 'getOtherQuizzesByTag' is correctly exported in your service
      const res = await getOtherQuizzesByTag(selectedTag);
      setData(res);
      setLoading(false);
    };
    fetch();
  }, [selectedTag]);

  return (
    <div className="mt-4 min-h-screen p-4 sm:p-8 max-w-7xl mx-auto">
      {/* Header Section */}
      <div className="flex flex-col gap-6 mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <button 
              onClick={() => navigate('/')}
              className="flex items-center gap-2 text-white/90 hover:text-white hover:bg-white/10 px-4 py-2 rounded-lg transition-all mb-2 -ml-2 w-fit"
            >
               <Home size={18}/>
               <span className="font-medium">Home</span>
            </button>
            <h2 className="text-3xl sm:text-4xl font-bold text-white drop-shadow-md flex items-center gap-3">
              <Library className="text-orange-400" />
              Other Quizzes
            </h2>
          </div>
        </div>

        {/* Tag Filter Bar */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
          <div className="flex items-center gap-2 text-white/80 mr-2">
            <Filter size={20} />
            <span className="text-sm font-medium whitespace-nowrap">Select:</span>
          </div>

          {availableTags.map((tag) => (
            <button
              key={tag.id}
              onClick={() => setSearchParams({ tag: tag.id })}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all whitespace-nowrap
                ${selectedTag === tag.id 
                  ? 'bg-orange-500 text-white shadow-lg scale-105' 
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
          Please select a tag above to load quizzes.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {data.length > 0 ? (
            data.map((item) => (
               <PracticeCard 
                 key={item.id}
                 practice={item} 
                 // Prepare the link to the detail page (even though it's not built yet)
                 onClick={() => navigate(`/other-quiz/${item.id}${selectedTag ? `?tag=${selectedTag}` : ''}`)} 
               />
            ))
          ) : (
            <div className="col-span-full text-center py-12 text-white/60">
              No data found for this category.
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default OtherQuizList;