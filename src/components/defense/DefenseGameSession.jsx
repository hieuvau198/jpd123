import React, { useState, useEffect, useRef } from 'react';
import { Card, Button, Typography, Result } from 'antd';
import { Heart, Shield, Home, RefreshCw, Target } from 'lucide-react';

import { 
  TOWER_HP_MAX, TOWER_SIZE, TOWER_X, DIFFICULTIES, SKIN_PROPS, BACKGROUND_IMAGES, SPACESHIP_ASSETS
} from './DefenseGameConstants';
import DefenseQuestionOverlay from './DefenseQuestionOverlay';

const { Title, Text } = Typography;

const DefenseGameSession = ({ levelData, onHome, onRestart }) => {
  // Game State
  const [gameState, setGameState] = useState('menu');
  const [hp, setHp] = useState(TOWER_HP_MAX);
  const [score, setScore] = useState(0);
  const [enemies, setEnemies] = useState([]);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [bgImage, setBgImage] = useState(''); 
  
  // Question State
  const [qIndex, setQIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState(null);
  const [isWrong, setIsWrong] = useState(false);

  // Refs
  const requestRef = useRef();
  const spawnTimerRef = useRef();
  const enemiesRef = useRef([]);
  const difficultyRef = useRef(null);
  const fullscreenWrapRef = useRef(null);
  const gameAreaRef = useRef(null);

  const currentQuestion = levelData.questions[qIndex % levelData.questions.length];

  // --- Preload Images & Fullscreen Listener ---
  useEffect(() => {
    Object.values(SPACESHIP_ASSETS).forEach((imageArray) => {
      imageArray.forEach((src) => {
        const img = new Image();
        img.src = src;
      });
    });

    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Exit fullscreen automatically when game ends or is left
  useEffect(() => {
    if (gameState !== 'playing' && document.fullscreenElement) {
      document.exitFullscreen().catch(err => console.error(err));
    }
  }, [gameState]);

  const startGame = async (diffKey) => {
    difficultyRef.current = DIFFICULTIES[diffKey];
    setHp(TOWER_HP_MAX);
    setScore(0);
    setQIndex(0);
    enemiesRef.current = [];
    setEnemies([]);
    const randomImg = BACKGROUND_IMAGES[Math.floor(Math.random() * BACKGROUND_IMAGES.length)];
    setBgImage(randomImg);
    setGameState('playing');

    // Trigger Fullscreen
    if (fullscreenWrapRef.current && !document.fullscreenElement) {
      try {
        await fullscreenWrapRef.current.requestFullscreen();
      } catch (err) {
        console.error("Fullscreen error:", err);
      }
    }
  };

  const handleRestart = () => {
    setGameState('menu');
  };

  // --- Game Loop Logic ---
  const spawnEnemy = () => {
    if (gameState !== 'playing' || !difficultyRef.current) return;
    
    const rand = Math.random();
    let skin = 1;
    const { p1, p2 } = difficultyRef.current;
    
    if (rand < p1) skin = 1;
    else if (rand < p1 + p2) skin = 2;
    else skin = 3;

    const props = SKIN_PROPS[skin];
    const width = gameAreaRef.current ? gameAreaRef.current.clientWidth : window.innerWidth;
    const height = gameAreaRef.current ? gameAreaRef.current.clientHeight : window.innerHeight;

    // Pick a random image variant from the selected level
    const availableImages = SPACESHIP_ASSETS[skin];
    const selectedImage = availableImages[Math.floor(Math.random() * availableImages.length)];

    const newEnemy = {
      id: Date.now() + Math.random(),
      x: width + 50,
      y: Math.random() * (height - props.size),
      speed: (1.5 + (Math.random() * 0.5)) * props.speedMod, 
      skin: skin,
      hp: props.hp,
      maxHp: props.hp,
      size: props.size,
      image: selectedImage
    };

    enemiesRef.current.push(newEnemy);
  };

  const updateGame = () => {
    if (gameState !== 'playing') return;

    const targetX = TOWER_X;
    const height = gameAreaRef.current ? gameAreaRef.current.clientHeight : 450;
    const targetY = height / 2 - TOWER_SIZE / 2;

    enemiesRef.current = enemiesRef.current.filter(enemy => {
      const dx = targetX - enemy.x;
      const dy = targetY - enemy.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance < (TOWER_SIZE / 2 + enemy.size / 3)) {
        setHp(prev => {
          const newHp = prev - 1;
          if (newHp <= 0) setGameState('lost');
          return newHp;
        });
        return false; 
      }

      const angle = Math.atan2(dy, dx);
      enemy.x += Math.cos(angle) * enemy.speed;
      enemy.y += Math.sin(angle) * enemy.speed;

      return true;
    });

    setEnemies([...enemiesRef.current]); 
    requestRef.current = requestAnimationFrame(updateGame);
  };

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

  useEffect(() => {
    if (score >= levelData.enemyCount) setGameState('won');
  }, [score, levelData.enemyCount]);

  // --- Interaction Logic ---
  const handleAnswer = (option) => {
    if (isWrong || gameState !== 'playing') return;
    setSelectedOption(option);
    
    if (option === currentQuestion.answer) {
      const targetX = TOWER_X;
      const height = gameAreaRef.current ? gameAreaRef.current.clientHeight : 450;
      const targetY = height / 2;
      
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
        enemiesRef.current[closestIdx].hp -= 1;
        if (enemiesRef.current[closestIdx].hp <= 0) {
          enemiesRef.current.splice(closestIdx, 1);
          setScore(prev => prev + 1);
        }
        setEnemies([...enemiesRef.current]);
      }

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

  // --- UI Renders ---
  if (gameState === 'menu') {
    return (
      <Card style={{ textAlign: 'center', maxWidth: 400, margin: '60px auto', boxShadow: '0 4px 12px rgba(226, 59, 59, 0.1)' }}>
        <Title level={2}><Target size={28} className="inline mr-2" color="#1890ff"/> Select Difficulty</Title>
        <Text type="secondary" style={{ display: 'block', marginBottom: 20 }}>Prepare to defend the base!</Text>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 15 }}>
          {Object.entries(DIFFICULTIES).map(([key, config]) => (
            <Button key={key} size="large" type={config.color} danger={config.danger} onClick={() => startGame(key)}>
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

  if (gameState === 'won' || gameState === 'lost') {
    return (
      <Card style={{ textAlign: 'center', maxWidth: 600, margin: '40px auto' }}>
        <Result
          status={gameState === 'won' ? "success" : "error"}
          title={gameState === 'won' ? "VICTORY!" : "DEFEAT"}
          subTitle={gameState === 'won' ? `You defended the base against ${score} Spaceships on ${difficultyRef.current?.label} difficulty!` : "The base has been overrun."}
          extra={[
            <Button key="home" onClick={onHome} icon={<Home size={16} />}>Home</Button>,
            <Button key="retry" type="primary" onClick={handleRestart} icon={<RefreshCw size={16} />}>Play Again</Button>
          ]}
        />
      </Card>
    );
  }

  // --- Playing State (Fullscreen enabled container) ---
  return (
    <div 
      ref={fullscreenWrapRef}
      style={{ 
        width: isFullscreen ? '100vw' : '100%', 
        height: isFullscreen ? '100vh' : '700px',
        maxWidth: isFullscreen ? 'none' : '1200px',
        margin: '0 auto', 
        display: 'flex', 
        flexDirection: 'column',
        backgroundImage: `url("${bgImage}")`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        borderRadius: isFullscreen ? 0 : 12,
        overflow: 'hidden',
        boxShadow: isFullscreen ? 'none' : '0 10px 30px rgba(0,0,0,0.3)'
      }}
    >
      {/* Header Stats pinned to top */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(0,0,0,0.6)', padding: '15px 25px', zIndex: 10 }}>
        <div style={{ display: 'flex', gap: 30 }}>
          <Text strong style={{ fontSize: 18, color: 'white' }}><Shield size={20} className="inline mr-1" color="#1890ff" /> Destroyed: {Math.min(score, levelData.enemyCount)} / {levelData.enemyCount}</Text>
          <Text strong style={{ fontSize: 18, color: hp < 3 ? '#ff4d4f' : '#52c41a' }}><Heart size={20} className="inline mr-1" fill={hp < 3 ? '#ff4d4f' : '#52c41a'} /> HP: {hp}</Text>
          <Text strong style={{ fontSize: 18, color: '#ccc' }}>Difficulty: {difficultyRef.current?.label}</Text>
        </div>
        <Button danger onClick={handleRestart}>Surrender</Button>
      </div>

      {/* Game Map Area */}
      <div ref={gameAreaRef} style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
        
        {/* Base / Tower */}
        <div style={{
          position: 'absolute',
          left: TOWER_X,
          top: '50%',
          transform: 'translateY(-50%)',
          width: TOWER_SIZE,
          height: TOWER_SIZE,
          background: '#a0c5e7',
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

        {/* Enemies */}
        {enemies.map(e => (
          <div
            key={e.id}
            style={{ position: 'absolute', left: e.x, top: e.y, width: e.size, height: e.size, zIndex: 5, pointerEvents: 'none' }}
          >
            {e.maxHp > 1 && (
              <div style={{ position: 'absolute', top: -10, width: '100%', display: 'flex', justifyContent: 'center', gap: 4 }}>
                {Array.from({ length: e.hp }).map((_, i) => (
                  <div key={i} style={{ width: 10, height: 10, borderRadius: '50%', background: '#ff4d4f', border: '1px solid white' }} />
                ))}
              </div>
            )}
            <img 
              src={e.image}
              alt="Spaceship"
              style={{ 
                width: '100%', 
                height: '100%',
                // Floating/Jiggling animation using Math.sin based on the X coordinate
                transform: `translateY(${Math.sin(e.x / 15) * 8}px) rotate(${Math.cos(e.x / 15) * 4}deg)`
              }}
            />
          </div>
        ))}

        {/* Overlay Component containing Questions */}
        <DefenseQuestionOverlay 
          currentQuestion={currentQuestion}
          isWrong={isWrong}
          selectedOption={selectedOption}
          handleAnswer={handleAnswer}
        />
      </div>
    </div>
  );
};

export default DefenseGameSession;