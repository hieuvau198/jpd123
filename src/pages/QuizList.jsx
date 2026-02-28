import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Home, Loader2, Library, Filter } from 'lucide-react';
// Import getQuizzesByTag instead of getAllQuizzes
import { getQuizzesByTag } from '../firebase/quizService'; 
import PracticeCard from '../components/PracticeCard';
import availableTags from '../data/system/tags.json'; // Import tags

const QuizList = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false); // Default to false
  const [selectedTag, setSelectedTag] = useState(null); // Default to no tag
  const navigate = useNavigate();

  // Fetch only when the selected tag changes
  useEffect(() => {
    const fetch = async () => {
      if (!selectedTag) {
        setData([]); // Clear data if no tag is selected
        return;
      }
      
      setLoading(true);
      // Call Firebase only for the selected tag to save read quota
      const res = await getQuizzesByTag(selectedTag);
      setData(res);
      setLoading(false);
    };
    fetch();
  }, [selectedTag]);

  return (
    <div className="min-h-screen p-4 sm:p-8 max-w-7xl mx-auto">
      {/* Header Section */}
      <div className="flex flex-col gap-6 mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <button 
              onClick={() => navigate('/')}
              className="flex items-center gap-2 text-white/90 hover:text-white hover:bg-white/10 px-4 py-2 rounded-lg transition-all mb-2 -ml-2 w-fit"
            >
               <Home size={18}/>
               <span className="font-medium">Back Home</span>
            </button>
            <h2 className="text-3xl sm:text-4xl font-bold text-white drop-shadow-md flex items-center gap-3">
              <Library className="text-yellow-300" />
              Quiz Library
            </h2>
          </div>
        </div>

        {/* Tag Filter Bar */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
          <div className="flex items-center gap-2 text-white/80 mr-2">
            <Filter size={20} />
            <span className="text-sm font-medium whitespace-nowrap">Filter by:</span>
          </div>
          
          {/* Removed the "All" button to enforce quota limits */}

          {availableTags.map((tag) => (
            <button
              key={tag.id}
              onClick={() => setSelectedTag(tag.id)}
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
          Please select a tag above to load quizzes.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {data.length > 0 ? (
            data.map((item) => (
               <PracticeCard 
                 key={item.id}
                 practice={item} 
                 onClick={() => navigate(`/quiz/${item.id}`)} 
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