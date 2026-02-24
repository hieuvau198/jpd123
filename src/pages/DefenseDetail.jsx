import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import DefenseGameSession from '../components/DefenseGameSession';
import { defenseLevels } from '../../data/mockDefenseData';

const DefenseDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [levelData, setLevelData] = useState(null);
  const [sessionKey, setSessionKey] = useState(0); // To force restart

  useEffect(() => {
    // Find mock data
    const level = defenseLevels.find(l => l.id === id);
    if (level) {
      setLevelData(level);
    } else {
      navigate('/defense');
    }
  }, [id, navigate]);

  if (!levelData) return <div className="text-white text-center p-10">Loading Level...</div>;

  return (
    <div className="min-h-screen bg-slate-100">
      <DefenseGameSession 
        key={sessionKey} 
        levelData={levelData} 
        onHome={() => navigate('/defense')}
        onRestart={() => setSessionKey(prev => prev + 1)}
      />
    </div>
  );
};

export default DefenseDetail;