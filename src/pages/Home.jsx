import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Layers, Brain, Settings } from 'lucide-react';

const Home = () => {
  const navigate = useNavigate();

  return (
    <div className="app-container" style={{ textAlign: 'center', paddingTop: '50px' }}>
      <div style={{display:'flex', justifyContent:'center', alignItems:'center', position: 'relative', marginBottom: 40}}>
        <h1 className="brand-title">Học Cùng Cô Quốc Anh &#128513;</h1>
        <button 
          onClick={() => navigate('/admin')} 
          className="icon-btn" 
          style={{ position: 'absolute', right: 0 }}
          title="Admin Dashboard"
        >
            <Settings size={20} />
        </button>
      </div>

      <div style={{ display: 'flex', gap: '20px', justifyContent: 'center', flexWrap: 'wrap' }}>
        {/* Flashcard Option */}
        <div 
          onClick={() => navigate('/flashcards')}
          className="practice-card"
          style={{ width: 250, height: 200, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', border: '2px solid #eee' }}
        >
            <Layers size={60} style={{ marginBottom: 20, color: '#1890ff' }} />
            <h2 style={{margin:0}}>Flashcards</h2>
            <p style={{color: '#888'}}>Review vocabulary</p>
        </div>

        {/* Quiz Option */}
        <div 
          onClick={() => navigate('/quizzes')}
          className="practice-card"
          style={{ width: 250, height: 200, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', border: '2px solid #eee' }}
        >
            <Brain size={60} style={{ marginBottom: 20, color: '#52c41a' }} />
            <h2 style={{margin:0}}>Quizzes</h2>
            <p style={{color: '#888'}}>Test your knowledge</p>
        </div>
      </div>
    </div>
  );
};

export default Home;