import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import DefenseGameSession from '../components/defense/DefenseGameSession';

import { getDefenseById } from '../firebase/defenseService';
import { getFlashcardById } from '../firebase/flashcardService';
import { getQuizById } from '../firebase/quizService';
import { getRepairById } from '../firebase/repairService';
import { getSpeakById } from '../firebase/speakService';

const DefenseDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [levelData, setLevelData] = useState(null);
  const [error, setError] = useState(null);
  const [sessionKey, setSessionKey] = useState(0); 

  useEffect(() => {
    const fetchLevelData = async () => {
      try {
        // 1. Fetch Defense Configuration
        const defenseConf = await getDefenseById(id);
        if (!defenseConf) {
          setError('Defense level not found.');
          return;
        }

        let sourceData = null;

        // 2. Load underlying actual data depending on the configured type and sourceId
        switch (defenseConf.type) {
          case 'flashcard':
            sourceData = await getFlashcardById(defenseConf.sourceId);
            break;
          case 'quiz':
            sourceData = await getQuizById(defenseConf.sourceId);
            break;
          case 'repair':
            sourceData = await getRepairById(defenseConf.sourceId);
            break;
          case 'speak':
            sourceData = await getSpeakById(defenseConf.sourceId);
            break;
          default:
            setError(`Unknown source type: ${defenseConf.type}`);
            return;
        }

        if (!sourceData) {
          setError(`Could not locate source data for ID: ${defenseConf.sourceId}`);
          return;
        }

        // 3. Extract the questions list. Commonly in "questions" or "words"
        const rawQuestions = sourceData.questions || sourceData.words || [];

        // 4. Combine into a format `DefenseGameSession` can read
        const completeLevelData = {
          ...defenseConf,
          questions: rawQuestions,
          enemyCount: defenseConf.enemyCount || 20,
          spawnRate: defenseConf.spawnRate || 2000,
        };

        setLevelData(completeLevelData);
      } catch (err) {
        console.error(err);
        setError('Failed to load level data.');
      }
    };

    fetchLevelData();
  }, [id, navigate]);

  if (error) return <div className="text-white text-center p-10">{error}</div>;
  if (!levelData) return <div className="text-white text-center p-10">Loading Base Defenses...</div>;

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