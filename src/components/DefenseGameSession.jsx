import React, { useState, useEffect, useRef } from 'react';
import { Card, Button, Typography, Result, Alert } from 'antd';
import { Heart, Shield, Home, RefreshCw, Zap } from 'lucide-react';

const { Title, Text } = Typography;

// --- Game Constants ---
const TOWER_HP_MAX = 5;
const GAME_WIDTH = 800;  
const GAME_HEIGHT = 450; 
const TOWER_SIZE = 80;   
const ENEMY_SIZE = 80;   
const TOWER_X = 50;      

// --- Animation Configuration ---
const FRAME_COUNT = 20; // 0001 to 0020
const ANIMATION_SPEED = 3; // Updates per game loop (Lower = Faster)

// Generate the paths for the 20 frames
const ZOMBIE_FRAMES = Array.from({ length: FRAME_COUNT }, (_, i) => {
  const num = (i + 1).toString().padStart(4, '0'); // 0001, 0002...
  return `/game_objects/zombies/run/Run_Body_270_${num}.png`;
});
// const ZOMBIE_FRAMES = Array.from({ length: FRAME_COUNT }, (_, i) => {
//   const num = (i + 1).toString().padStart(4, '0'); // 0001, 0002...
//   return `/game_objects/zombies/270/Walk_Body_270_${num}.png`;
// });

const DefenseGameSession = ({ levelData, onHome, onRestart }) => {
  // Game State
  const [gameState, setGameState] = useState('playing'); 
  const [hp, setHp] = useState(TOWER_HP_MAX);
  const [score, setScore] = useState(0);
  const [enemies, setEnemies] = useState([]);
  
  // Question State
  const [qIndex, setQIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState(null);
  const [isWrong, setIsWrong] = useState(false);

  // Refs for loops
  const requestRef = useRef();
  const spawnTimerRef = useRef();
  const enemiesRef = useRef([]);

  const currentQuestion = levelData.questions[qIndex % levelData.questions.length];

  // --- Preload Images (Optional but recommended for smoothness) ---
  useEffect(() => {
    ZOMBIE_FRAMES.forEach((src) => {
      const img = new Image();
      img.src = src;
    });
  }, []);

  // --- Game Loop Logic ---
  
  // Spawn Enemy 
  const spawnEnemy = () => {
    if (gameState !== 'playing') return;
    
    const startX = GAME_WIDTH + 50; 
    const startY = Math.random() * (GAME_HEIGHT - ENEMY_SIZE);

    const newEnemy = {
      id: Date.now() + Math.random(),
      x: startX,
      y: startY,
      speed: 1.5 + (Math.random() * 0.5), 
      // Animation State
      frameIndex: 0,
      frameTimer: 0
    };

    enemiesRef.current.push(newEnemy);
  };

  // Main Loop
  const updateGame = () => {
    if (gameState !== 'playing') return;

    const targetX = TOWER_X;
    const targetY = GAME_HEIGHT / 2 - TOWER_SIZE / 2;

    enemiesRef.current = enemiesRef.current.filter(enemy => {
      const dx = targetX - enemy.x;
      const dy = targetY - enemy.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      // Hit Tower Logic
      if (distance < (TOWER_SIZE / 2 + ENEMY_SIZE / 3)) {
        setHp(prev => {
          const newHp = prev - 1;
          if (newHp <= 0) setGameState('lost');
          return newHp;
        });
        return false; // Remove enemy
      }

      // Move towards tower
      const angle = Math.atan2(dy, dx);
      enemy.x += Math.cos(angle) * enemy.speed;
      enemy.y += Math.sin(angle) * enemy.speed;

      // Update Animation Frame
      enemy.frameTimer++;
      if (enemy.frameTimer >= ANIMATION_SPEED) {
        enemy.frameIndex = (enemy.frameIndex + 1) % FRAME_COUNT;
        enemy.frameTimer = 0;
      }

      return true;
    });

    // Force re-render to show positions
    setEnemies([...enemiesRef.current]); 
    
    requestRef.current = requestAnimationFrame(updateGame);
  };

  // Initialize Loop
  useEffect(() => {
    if (gameState === 'playing') {
      requestRef.current = requestAnimationFrame(updateGame);
      spawnTimerRef.current = setInterval(spawnEnemy, levelData.spawnRate);
    }
    return () => {
      cancelAnimationFrame(requestRef.current);
      clearInterval(spawnTimerRef.current);
    };
  }, [gameState]);

  // Win Condition Check
  useEffect(() => {
    if (score >= levelData.enemyCount) {
      setGameState('won');
    }
  }, [score]);


  // --- Interaction Logic ---

  const handleAnswer = (option) => {
    if (isWrong || gameState !== 'playing') return;
    
    if (option === currentQuestion.answer) {
      // Correct! - Kill closest enemy
      const targetX = TOWER_X;
      const targetY = GAME_HEIGHT / 2;
      
      let closestIdx = -1;
      let minDist = Infinity;

      enemiesRef.current.forEach((e, idx) => {
        const d = Math.sqrt(Math.pow(targetX - e.x, 2) + Math.pow(targetY - e.y, 2));
        if (d < minDist) {
          minDist = d;
          closestIdx = idx;
        }
      });

      if (closestIdx !== -1) {
        enemiesRef.current.splice(closestIdx, 1);
        setEnemies([...enemiesRef.current]);
      }

      setScore(prev => prev + 1);
      setQIndex(prev => prev + 1);
      
    } else {
      setIsWrong(true);
      setTimeout(() => setIsWrong(false), 1000);
    }
  };

  // --- Render Helpers ---

  if (gameState === 'won') {
    return (
      <Card style={{ textAlign: 'center', maxWidth: 600, margin: '40px auto' }}>
        <Result
          status="success"
          title="VICTORY!"
          subTitle={`You defended the base against ${score} Zombies!`}
          extra={[
            <Button key="home" onClick={onHome} icon={<Home size={16} />}>Home</Button>,
            <Button key="retry" type="primary" onClick={onRestart} icon={<RefreshCw size={16} />}>Replay</Button>
          ]}
        />
      </Card>
    );
  }

  if (gameState === 'lost') {
    return (
      <Card style={{ textAlign: 'center', maxWidth: 600, margin: '40px auto' }}>
        <Result
          status="error"
          title="DEFEAT"
          subTitle="The base has been overrun."
          extra={[
            <Button key="home" onClick={onHome} icon={<Home size={16} />}>Home</Button>,
            <Button key="retry" type="primary" onClick={onRestart} icon={<RefreshCw size={16} />}>Try Again</Button>
          ]}
        />
      </Card>
    );
  }

  return (
    <div style={{ padding: 20, maxWidth: 1000, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 20 }}>
      
      {/* Header Stats */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fff', padding: '10px 20px', borderRadius: 10, boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
        <div style={{ display: 'flex', gap: 20 }}>
          <Text strong style={{ fontSize: 18 }}><Shield size={20} className="inline mr-1" color="#1890ff" /> Wave: {Math.min(score, levelData.enemyCount)} / {levelData.enemyCount}</Text>
          <Text strong style={{ fontSize: 18, color: hp < 3 ? 'red' : 'green' }}><Heart size={20} className="inline mr-1" fill={hp < 3 ? 'red' : 'green'} /> HP: {hp}</Text>
        </div>
        <Button danger onClick={onHome}>Surrender</Button>
      </div>

      {/* Game Map Area */}
      <Card 
        bodyStyle={{ padding: 0, overflow: 'hidden', borderRadius: '0 0 8px 8px' }}
        style={{ width: '100%', border: '2px solid #1890ff' }}
        title={<><Zap size={18} className="inline mr-2"/> Defense Zone</>}
      >
        <div style={{ 
          position: 'relative', 
          width: '100%', 
          height: GAME_HEIGHT, 
          background: 'linear-gradient(to right, #333, #555)', 
          overflow: 'hidden'
        }}>
          {/* Base / Tower */}
          <div style={{
            position: 'absolute',
            left: TOWER_X,
            top: GAME_HEIGHT / 2 - TOWER_SIZE / 2,
            width: TOWER_SIZE,
            height: TOWER_SIZE,
            background: '#1890ff',
            borderRadius: 8,
            boxShadow: '0 0 20px #1890ff',
            zIndex: 10,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '4px solid white'
          }}>
            <Shield color="white" size={40} />
          </div>

          {/* Enemies (Sequence Animation) */}
          {enemies.map(e => (
            <img 
              key={e.id} 
              src={ZOMBIE_FRAMES[e.frameIndex]} // Cycles 0 to 19
              alt="Zombie"
              style={{
                position: 'absolute',
                left: e.x,
                top: e.y,
                width: ENEMY_SIZE,
                height: ENEMY_SIZE,
                zIndex: 5,
                transition: 'none', 
                pointerEvents: 'none' // Improves performance
              }}
            />
          ))}
        </div>
      </Card>

      {/* Question Area */}
      <Card 
        size="small"
        style={{ width: '100%', background: '#fff' }}
        bodyStyle={{ padding: '15px' }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
          {isWrong && <Alert message="Missed! Aim carefully!" type="error" showIcon style={{ padding: '2px 10px' }} />}
          
          <Title level={4} style={{ margin: 0, textAlign: 'center' }}>{currentQuestion.question}</Title>
          
          <div style={{ display: 'flex', gap: 10, width: '100%', justifyContent: 'center', flexWrap: 'wrap' }}>
            {currentQuestion.options.map((opt, i) => (
              <Button 
                key={i} 
                size="large" 
                onClick={() => handleAnswer(opt)}
                disabled={isWrong}
                type={isWrong && selectedOption === opt ? 'primary' : 'default'}
                danger={isWrong && selectedOption === opt}
                style={{ minWidth: 150, flex: '1 1 200px' }}
              >
                {opt}
              </Button>
            ))}
          </div>
        </div>
      </Card>
    </div>
  );
};

export default DefenseGameSession;