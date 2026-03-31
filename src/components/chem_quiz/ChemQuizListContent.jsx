import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Home, Loader2, FlaskConical, Filter } from 'lucide-react';
import { getChemistryByTag } from '../../firebase/chemistryService'; 
import PracticeCard from '../PracticeCard';
import chemTags from '../../data/system/chem_tags.json'; // Updated tag source

const ChemQuizListContent = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  
  const [searchParams, setSearchParams] = useSearchParams(); 
  // Change: Remove the default 'all' fallback. It defaults to null.
  const selectedTag = searchParams.get('tag'); 
  
  const navigate = useNavigate();

  // Prepend "All" option to the tags list
  const availableTags = [ ...chemTags];

  useEffect(() => {
    const fetch = async () => {
      // Change: If no tag is selected, don't fetch anything to prevent big data request
      if (!selectedTag) {
        setData([]);
        return;
      }

      setLoading(true);
      const res = await getChemistryByTag(selectedTag === 'all' ? null : selectedTag);
      setData(res || []);
      setLoading(false);
    };
    fetch();
  }, [selectedTag]);

  return (
    <div className="min-h-screen p-4 sm:p-8 max-w-7xl mx-auto">
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
              <FlaskConical className="text-teal-400" />
              Chemistry Quizzes
            </h2>
          </div>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
          

          {availableTags.map((tag) => (
            <button
              key={tag.id}
              onClick={() => setSearchParams({ tag: tag.id })}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all whitespace-nowrap
                ${selectedTag === tag.id 
                  ? 'bg-teal-400 text-black shadow-lg scale-105' 
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
                 onClick={() => navigate(`/chem-quiz/${item.id}?tag=${selectedTag}`)} 
               />
            ))
          ) : (
            <div className="col-span-full text-center py-12 text-white/60">
              No chemistry quizzes found for this category.
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ChemQuizListContent;