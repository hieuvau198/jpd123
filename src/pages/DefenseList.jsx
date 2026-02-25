import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Home, Swords } from 'lucide-react';
import { getAllDefenses } from '../firebase/defenseService';

const DefenseList = () => {
  const navigate = useNavigate();
  const [levels, setLevels] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLevels = async () => {
      const data = await getAllDefenses();
      setLevels(data);
      setLoading(false);
    };
    fetchLevels();
  }, []);

  return (
    <div className="min-h-screen p-4 sm:p-8 max-w-7xl mx-auto bg-slate-900">
      <div className="flex flex-col gap-6 mb-8">
        <button 
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-white/90 hover:text-white px-4 py-2 rounded-lg w-fit"
        >
           <Home size={18}/> Back Home
        </button>
        <h2 className="text-3xl sm:text-4xl font-bold text-white flex items-center gap-3">
          <Shield className="text-red-500" />
          Defense Mode
        </h2>
        <p className="text-white/60">Protect the tower by answering questions before the enemies reach the center!</p>
      </div>

      {loading ? (
        <div className="text-white">Loading levels...</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {levels.map((level) => (
            <div 
              key={level.id}
              onClick={() => navigate(`/defense/${level.id}`)}
              className="bg-white/10 hover:bg-white/20 p-6 rounded-xl cursor-pointer transition-all border border-white/5 hover:border-red-500/50 group"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="p-3 bg-red-500/20 rounded-lg group-hover:bg-red-500 transition-colors">
                  <Swords className="text-red-500 group-hover:text-white" size={24} />
                </div>
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-500 text-white uppercase">
                  {level.type}
                </span>
              </div>
              <h3 className="text-xl font-bold text-white mb-2">{level.title}</h3>
              <p className="text-white/60 text-sm mb-4">
                 Test your skills using questions from {level.type}.
              </p>
              <div className="flex items-center gap-4 text-xs text-white/40 font-mono">
                <span>{level.enemyCount || 20} Enemies</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DefenseList;