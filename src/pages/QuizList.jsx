import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Home, Loader2, Library } from 'lucide-react';
import PracticeCard from '../components/PracticeCard';
import { getAllQuizzes } from '../firebase/quizService';

const QuizList = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetch = async () => {
      const res = await getAllQuizzes();
      setData(res);
      setLoading(false);
    };
    fetch();
  }, []);

  return (
    <div className="min-h-screen p-4 sm:p-8 max-w-7xl mx-auto">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
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
        
        {/* Optional: Add a search bar or filter here later */}
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
           <Loader2 className="w-12 h-12 text-white animate-spin opacity-80" />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {data.map((item) => (
             <PracticeCard 
               key={item.id}
               practice={item} 
               onClick={() => navigate(`/quiz/${item.id}`)} 
             />
          ))}
        </div>
      )}
    </div>
  );
};

export default QuizList;