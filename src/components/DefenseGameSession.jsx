import React, { useState, useEffect, useRef } from 'react';
import { Card, Button, Typography, Result, Alert } from 'antd';
import { Heart, Shield, Home, RefreshCw, Zap, Target } from 'lucide-react';

const { Title, Text } = Typography;

// --- Game Constants ---
const TOWER_HP_MAX = 5;
const GAME_WIDTH = 800;  
const GAME_HEIGHT = 450; 
const TOWER_SIZE = 80;   
const TOWER_X = 50;      

// --- Animation Configuration ---
const FRAME_COUNT = 10; // Updated from 20 to 10
const ANIMATION_SPEED = 4; // Updates per game loop (Adjusted slightly for 10 frames)

// Generate the paths for the 10 frames for all 3 skins
const getFrames = (skinNum) => Array.from({ length: FRAME_COUNT }, (_, i) => {
  const num = (i + 1).toString().padStart(4, '0'); // 0001 to 0010
  return `/game_objects/zombies/skin_${skinNum}/Run_Body_270_${num}.png`;
});

const ZOMBIE_FRAMES = {
  1: getFrames(1),
  2: getFrames(2),
  3: getFrames(3)
};

// --- Difficulty & Skin Configurations ---
const DIFFICULTIES = {
  Noob:     { label: 'Noob',     color: 'default', p1: 0.8, p2: 0.2, p3: 0.0 },
  Beginner: { label: 'Beginner', color: 'primary', p1: 0.6, p2: 0.4, p3: 0.0 },
  Master:   { label: 'Master',   color: 'primary', danger: true, p1: 0.5, p2: 0.4, p3: 0.1 },
  Hell:     { label: 'Hell',     color: 'dashed',  danger: true, p1: 0.2, p2: 0.6, p3: 0.2 },
  Legend:   { label: 'Legend',   color: 'primary', danger: true, p1: 0.0, p2: 0.5, p3: 0.5 }
};

const SKIN_PROPS = {
  1: { hp: 1, size: 80,  speedMod: 1.0 },
  2: { hp: 2, size: 120, speedMod: 0.8 }, // Slightly slower because it's bigger
  3: { hp: 3, size: 160, speedMod: 0.6 }  // Slowest but tankiest
};

const DefenseGameSession = ({ levelData, onHome, onRestart }) => {
  // Game State
  const [gameState, setGameState] = useState('menu'); // changed initial state to menu
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
  const difficultyRef = useRef(null);

  const currentQuestion = levelData.questions[qIndex % levelData.questions.length];

  // --- Preload Images ---
  useEffect(() => {
    Object.values(ZOMBIE_FRAMES).forEach((skinGroup) => {
      skinGroup.forEach((src) => {
        const img = new Image();
        img.src = src;
      });
    });
  }, []);

  // --- Start Game ---
  const startGame = (diffKey) => {
    difficultyRef.current = DIFFICULTIES[diffKey];
    setHp(TOWER_HP_MAX);
    setScore(0);
    setQIndex(0);
    enemiesRef.current = [];
    setEnemies([]);
    setGameState('playing');
  };

  const handleRestart = () => {
    setGameState('menu');
  };

  // --- Game Loop Logic ---
  
  // Spawn Enemy 
  const spawnEnemy = () => {
    if (gameState !== 'playing' || !difficultyRef.current) return;
    
    // Determine which skin to spawn based on difficulty probabilities
    const rand = Math.random();
    let skin = 1;
    const { p1, p2 } = difficultyRef.current;
    
    if (rand < p1) {
      skin = 1;
    } else if (rand < p1 + p2) {
      skin = 2;
    } else {
      skin = 3;
    }

    const props = SKIN_PROPS[skin];

    const startX = GAME_WIDTH + 50; 
    const startY = Math.random() * (GAME_HEIGHT - props.size);

    const newEnemy = {
      id: Date.now() + Math.random(),
      x: startX,
      y: startY,
      speed: (1.5 + (Math.random() * 0.5)) * props.speedMod, 
      skin: skin,
      hp: props.hp,
      maxHp: props.hp,
      size: props.size,
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

      // Hit Tower Logic (Dynamically checks using individual enemy size)
      if (distance < (TOWER_SIZE / 2 + enemy.size / 3)) {
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
  }, [score, levelData.enemyCount]);


  // --- Interaction Logic ---

  const handleAnswer = (option) => {
    if (isWrong || gameState !== 'playing') return;
    setSelectedOption(option);
    
    if (option === currentQuestion.answer) {
      // Correct! - Hit closest enemy
      const targetX = TOWER_X;
      const targetY = GAME_HEIGHT / 2;
      
      let closestIdx = -1;
      let minDist = Infinity;

      // Find the closest enemy
      enemiesRef.current.forEach((e, idx) => {
        const d = Math.sqrt(Math.pow(targetX - e.x, 2) + Math.pow(targetY - e.y, 2));
        if (d < minDist) {
          minDist = d;
          closestIdx = idx;
        }
      });

      if (closestIdx !== -1) {
        // Decrease enemy HP
        enemiesRef.current[closestIdx].hp -= 1;
        
        // If enemy HP drops to 0, kill it and increase score
        if (enemiesRef.current[closestIdx].hp <= 0) {
          enemiesRef.current.splice(closestIdx, 1);
          setScore(prev => prev + 1);
        }
        
        setEnemies([...enemiesRef.current]);
      }

      // Move to next question regardless
      setQIndex(prev => prev + 1);
      setSelectedOption(null);
      
    } else {
      setIsWrong(true);
      setTimeout(() => {
        setIsWrong(false);
        setSelectedOption(null);
      }, 1000);
    }
  };

  // --- Render Helpers ---

  if (gameState === 'menu') {
    return (
      <Card style={{ textAlign: 'center', maxWidth: 400, margin: '60px auto', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
        <Title level={2}><Target size={28} className="inline mr-2" color="#1890ff"/> Select Difficulty</Title>
        <Text type="secondary" style={{ display: 'block', marginBottom: 20 }}>Prepare to defend the base!</Text>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 15 }}>
          {Object.entries(DIFFICULTIES).map(([key, config]) => (
            <Button 
              key={key} 
              size="large" 
              type={config.color} 
              danger={config.danger} 
              onClick={() => startGame(key)}
            >
              {config.label}
            </Button>
          ))}
        </div>
        <div style={{ marginTop: 20 }}>
          <Button type="text" onClick={onHome} icon={<Home size={16} />}>Back to Home</Button>
        </div>
      </Card>
    );
  }

  if (gameState === 'won') {
    return (
      <Card style={{ textAlign: 'center', maxWidth: 600, margin: '40px auto' }}>
        <Result
          status="success"
          title="VICTORY!"
          subTitle={`You defended the base against ${score} Zombies on ${difficultyRef.current?.label} difficulty!`}
          extra={[
            <Button key="home" onClick={onHome} icon={<Home size={16} />}>Home</Button>,
            <Button key="retry" type="primary" onClick={handleRestart} icon={<RefreshCw size={16} />}>Play Again</Button>
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
            <Button key="retry" type="primary" onClick={handleRestart} icon={<RefreshCw size={16} />}>Try Again</Button>
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
          <Text strong style={{ fontSize: 18 }}><Shield size={20} className="inline mr-1" color="#1890ff" /> Killed: {Math.min(score, levelData.enemyCount)} / {levelData.enemyCount}</Text>
          <Text strong style={{ fontSize: 18, color: hp < 3 ? 'red' : 'green' }}><Heart size={20} className="inline mr-1" fill={hp < 3 ? 'red' : 'green'} /> HP: {hp}</Text>
          <Text strong style={{ fontSize: 18, color: '#888' }}>Difficulty: {difficultyRef.current?.label}</Text>
        </div>
        <Button danger onClick={handleRestart}>Surrender</Button>
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
            <div
              key={e.id}
              style={{
                position: 'absolute',
                left: e.x,
                top: e.y,
                width: e.size,
                height: e.size,
                zIndex: 5,
                transition: 'none', 
                pointerEvents: 'none' // Improves performance
              }}
            >
              {/* HP Bar for zombies with > 1 HP */}
              {e.maxHp > 1 && (
                <div style={{ 
                  position: 'absolute', 
                  top: -10, 
                  width: '100%', 
                  display: 'flex', 
                  justifyContent: 'center', 
                  gap: 4 
                }}>
                  {Array.from({ length: e.hp }).map((_, i) => (
                    <div key={i} style={{ width: 10, height: 10, borderRadius: '50%', background: '#ff4d4f', border: '1px solid white' }} />
                  ))}
                </div>
              )}
              
              <img 
                src={ZOMBIE_FRAMES[e.skin][e.frameIndex]} // Uses the specific frame index for the specific skin
                alt="Zombie"
                style={{ width: '100%', height: '100%' }}
              />
            </div>
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