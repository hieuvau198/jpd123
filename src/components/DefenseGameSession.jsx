import React, { useState, useEffect, useRef } from 'react';
import { Card, Button, Typography, Progress, Result, Row, Col, Alert } from 'antd';
import { Heart, Shield, Zap, Skull, Home, RefreshCw } from 'lucide-react';

const { Title, Text } = Typography;

// Game Constants
const TOWER_HP_MAX = 5;
const GAME_SIZE = 400; // Size of the game box in pixels
const TOWER_SIZE = 40;
const ENEMY_SIZE = 20;

const DefenseGameSession = ({ levelData, onHome, onRestart }) => {
  // Game State
  const [gameState, setGameState] = useState('playing'); // playing, won, lost
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
  const enemiesRef = useRef([]); // Keep track of enemies without triggering re-renders for movement

  const currentQuestion = levelData.questions[qIndex % levelData.questions.length];

  // --- Game Loop Logic ---
  
  // Spawn Enemy
  const spawnEnemy = () => {
    if (gameState !== 'playing') return;
    
    // Spawn from random edge
    const edge = Math.floor(Math.random() * 4); // 0: top, 1: right, 2: bottom, 3: left
    let startX, startY;
    
    switch(edge) {
      case 0: startX = Math.random() * GAME_SIZE; startY = 0; break;
      case 1: startX = GAME_SIZE; startY = Math.random() * GAME_SIZE; break;
      case 2: startX = Math.random() * GAME_SIZE; startY = GAME_SIZE; break;
      case 3: startX = 0; startY = Math.random() * GAME_SIZE; break;
      default: startX = 0; startY = 0;
    }

    const newEnemy = {
      id: Date.now() + Math.random(),
      x: startX,
      y: startY,
      speed: 0.5 + (Math.random() * 0.3), // Vary speed slightly
    };

    enemiesRef.current.push(newEnemy);
  };

  // Main Loop
  const updateGame = () => {
    if (gameState !== 'playing') return;

    const centerX = GAME_SIZE / 2;
    const centerY = GAME_SIZE / 2;

    // Move enemies
    enemiesRef.current = enemiesRef.current.filter(enemy => {
      const dx = centerX - enemy.x;
      const dy = centerY - enemy.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      // Hit Tower Logic
      if (distance < (TOWER_SIZE / 2 + ENEMY_SIZE / 2)) {
        setHp(prev => {
          const newHp = prev - 1;
          if (newHp <= 0) setGameState('lost');
          return newHp;
        });
        return false; // Remove enemy
      }

      // Move normal
      const angle = Math.atan2(dy, dx);
      enemy.x += Math.cos(angle) * enemy.speed;
      enemy.y += Math.sin(angle) * enemy.speed;
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
      // Correct!
      // 1. Kill closest enemy
      const centerX = GAME_SIZE / 2;
      const centerY = GAME_SIZE / 2;
      
      let closestIdx = -1;
      let minDist = Infinity;

      enemiesRef.current.forEach((e, idx) => {
        const d = Math.sqrt(Math.pow(centerX - e.x, 2) + Math.pow(centerY - e.y, 2));
        if (d < minDist) {
          minDist = d;
          closestIdx = idx;
        }
      });

      if (closestIdx !== -1) {
        enemiesRef.current.splice(closestIdx, 1);
        setEnemies([...enemiesRef.current]);
      }

      // 2. Update Score & Question
      setScore(prev => prev + 1);
      setQIndex(prev => prev + 1);
      
    } else {
      // Wrong!
      setIsWrong(true);
      // Penalty: Maybe spawn an extra enemy or just timeout?
      // For now, simple delay before allowed to try again
      setTimeout(() => setIsWrong(false), 1000);
    }
  };

  // --- Render Helpers ---

  if (gameState === 'won') {
    return (
      <Card style={{ textAlign: 'center', maxWidth: 500, margin: '40px auto' }}>
        <Result
          status="success"
          title="VICTORY!"
          subTitle={`You defended the tower against ${score} enemies.`}
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
      <Card style={{ textAlign: 'center', maxWidth: 500, margin: '40px auto' }}>
        <Result
          status="error"
          title="DEFEAT"
          subTitle="The tower has fallen."
          extra={[
            <Button key="home" onClick={onHome} icon={<Home size={16} />}>Home</Button>,
            <Button key="retry" type="primary" onClick={onRestart} icon={<RefreshCw size={16} />}>Try Again</Button>
          ]}
        />
      </Card>
    );
  }

  return (
    <div style={{ padding: 20, maxWidth: 1200, margin: '0 auto' }}>
      
      {/* Header Stats */}
      <div style={{ marginBottom: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fff', padding: 15, borderRadius: 10, boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
        <div style={{ display: 'flex', gap: 15 }}>
          <Text strong style={{ fontSize: 18 }}><Shield size={20} color="#1890ff" /> Wave: {Math.min(score, levelData.enemyCount)} / {levelData.enemyCount}</Text>
          <Text strong style={{ fontSize: 18, color: hp < 3 ? 'red' : 'green' }}><Heart size={20} fill={hp < 3 ? 'red' : 'green'} /> HP: {hp}</Text>
        </div>
        <Button danger onClick={onHome}>Surrender</Button>
      </div>

      <Row gutter={[24, 24]}>
        {/* Game Map Area */}
        <Col xs={24} md={12}>
          <Card 
            title={<><Zap size={18} className="inline mr-2"/> Battlefield</>}
            bodyStyle={{ padding: 0, display: 'flex', justifyContent: 'center', background: '#f0f2f5' }}
          >
            <div style={{ 
              position: 'relative', 
              width: GAME_SIZE, 
              height: GAME_SIZE, 
              overflow: 'hidden',
              background: '#e6f7ff',
              border: '1px solid #91d5ff'
            }}>
              {/* Tower */}
              <div style={{
                position: 'absolute',
                left: GAME_SIZE/2 - TOWER_SIZE/2,
                top: GAME_SIZE/2 - TOWER_SIZE/2,
                width: TOWER_SIZE,
                height: TOWER_SIZE,
                background: '#1890ff',
                borderRadius: 4,
                boxShadow: '0 0 15px #1890ff',
                zIndex: 10,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Shield color="white" size={24} />
              </div>

              {/* Enemies */}
              {enemies.map(e => (
                <div key={e.id} style={{
                  position: 'absolute',
                  left: e.x - ENEMY_SIZE/2,
                  top: e.y - ENEMY_SIZE/2,
                  width: ENEMY_SIZE,
                  height: ENEMY_SIZE,
                  background: '#ff4d4f',
                  borderRadius: '50%',
                  zIndex: 5,
                  transition: 'none', // Important for smooth requestAnimationFrame
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                   <Skull size={14} color="white" />
                </div>
              ))}
            </div>
          </Card>
        </Col>

        {/* Question Area */}
        <Col xs={24} md={12}>
          <Card 
            title="Defense Control" 
            style={{ height: '100%' }}
            extra={<Text type="secondary">Answer to shoot!</Text>}
          >
            <div style={{ textAlign: 'center', marginBottom: 30 }}>
              <Title level={3}>{currentQuestion.question}</Title>
              {isWrong && <Alert message="Target Missed! Try again!" type="error" showIcon style={{ marginBottom: 10 }} />}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 15 }}>
              {currentQuestion.options.map((opt, i) => (
                <Button 
                  key={i} 
                  size="large" 
                  onClick={() => handleAnswer(opt)}
                  disabled={isWrong}
                  style={{ height: 60, fontSize: '1.1rem' }}
                  danger={isWrong && selectedOption === opt}
                >
                  {opt}
                </Button>
              ))}
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default DefenseGameSession;