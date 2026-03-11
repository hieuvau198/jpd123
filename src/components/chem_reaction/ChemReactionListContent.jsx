// src/components/chem_reaction/ChemReactionListContent.jsx
import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Home, Loader2, Beaker, Filter } from 'lucide-react';
import { getChemReactionsByTag } from '../../firebase/chemReactionService'; 
import PracticeCard from '../PracticeCard';
import chemTags from '../../data/system/chem_tags.json'; 

const ChemReactionListContent = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  
  const [searchParams, setSearchParams] = useSearchParams(); 
  const selectedTag = searchParams.get('tag') || 'all'; 
  
  const navigate = useNavigate();
  const availableTags = [{ id: 'all', name: 'All' }, ...chemTags];

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      const res = await getChemReactionsByTag(selectedTag === 'all' ? null : selectedTag);
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
              <Beaker className="text-orange-400" />
              Chemistry Reactions
            </h2>
          </div>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
          <div className="flex items-center gap-2 text-white/80 mr-2">
            <Filter size={20} />
            <span className="text-sm font-medium whitespace-nowrap">Filter by:</span>
          </div>

          {availableTags.map((tag) => (
            <button
              key={tag.id}
              onClick={() => setSearchParams({ tag: tag.id })}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all whitespace-nowrap
                ${selectedTag === tag.id 
                  ? 'bg-orange-400 text-black shadow-lg scale-105' 
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
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {data.length > 0 ? (
            data.map((item) => (
               <PracticeCard 
                 key={item.id}
                 practice={item} 
                 onClick={() => navigate(`/chem-reaction/${item.id}?tag=${selectedTag}`)} 
               />
            ))
          ) : (
            <div className="col-span-full text-center py-12 text-white/60">
              No chemistry reactions found for this category.
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ChemReactionListContent;