// src/components/SessionResult.jsx
import React, { useEffect, useState } from 'react';
import { Button, Typography, Flex, Card, Spin, Modal, Result, Progress } from 'antd';
import { ALL_LEVELS, getRatingInfo } from './flashcard/flashcardConstants';
import { getUserMissions, updateMission } from '../firebase/missionService'; 
import { updateUser } from '../firebase/userService'; 
import { updateUserHistory } from '../firebase/historyService'; // <-- Add this import
import titlesData from '../data/system/titles.json';

const { Title, Text } = Typography;

const SessionResult = ({ 
  score, 
  onBack, 
  onRestart, 
  backText = "Back to Menu", 
  restartText = "Play Again", 
  resultMessage,
  practiceId,     
  practiceType,
  practiceName    // <-- Add this new prop
}) => {
  const rating = getRatingInfo(score);
  
  const [isCheckingMission, setIsCheckingMission] = useState(false);
  const [showMissionModal, setShowMissionModal] = useState(false);
  const [missionResult, setMissionResult] = useState(null);

  // --- NEW: Update History Effect ---
  useEffect(() => {
    const updateHistory = async () => {
      if (!practiceId || !practiceType) return;
      
      const storageKey = localStorage.getItem('userSession') ? 'userSession' : 'user';
      const userStr = localStorage.getItem(storageKey);
      if (!userStr) return; // Only save history if logged in
      
      const user = JSON.parse(userStr);

      await updateUserHistory(user.id, {
        id: practiceId,
        name: practiceName || `${practiceType} Practice`,
        type: practiceType,
        score: score
      });
    };

    updateHistory();
  }, [practiceId, practiceType, practiceName, score]);
  // ---------------------------------

  useEffect(() => {
    const checkAndCompleteMission = async () => {
      if (!practiceId || !['Flashcard', 'Quiz', 'Phonetic', 'Repair', 'Chem Quiz'].includes(practiceType)) {
        return;
      }

      setIsCheckingMission(true);

      try {
        const storageKey = localStorage.getItem('userSession') ? 'userSession' : 'user';
        const userStr = localStorage.getItem(storageKey);
        
        if (!userStr) {
          setIsCheckingMission(false);
          return;
        }
        const user = JSON.parse(userStr);

        const missions = await getUserMissions(user.id, true); 

        const pendingMission = missions.find(m => {
          const matchesId = m.practiceId === practiceId || m.flashcardId === practiceId || m.quizId === practiceId;
          const isPending = m.status !== 'Đã chinh phục'; 
          
          return matchesId && isPending;
        });

        if (pendingMission) {
          const newPercentage = score;
          const currentPercentage = pendingMission.percentage || 0;
          
          if (newPercentage > currentPercentage) {
            const isCompleted = newPercentage >= 100;

            const maxCoins = pendingMission.max_coins || 0;
            const currentEarningCoins = pendingMission.earning_coins || 0;
            const expectedCoins = Math.floor(maxCoins * (newPercentage / 100));
            const newlyEarnedCoins = Math.max(0, expectedCoins - currentEarningCoins);
            const newTotalEarningCoins = currentEarningCoins + newlyEarnedCoins;

            const updatePayload = {
              percentage: newPercentage,
              earning_coins: newTotalEarningCoins,
              userId: user.id 
            };

            if (isCompleted) {
              updatePayload.status = 'Đã chinh phục';
              updatePayload.completedAt = new Date();
              if (newTotalEarningCoins < maxCoins) {
                  updatePayload.earning_coins = maxCoins;
              }
            } else {
              updatePayload.status = 'Đang thực hiện'; 
            }

            await updateMission(pendingMission.id, updatePayload);

            let hasNewTitle = false;
            let newTitle = user.title || titlesData[0].title;

            // Update user's personal balance, level, and title
            if (newlyEarnedCoins > 0) {
               const currentPersonalCoins = user.personal_coins || 0;
               const newTotalCoins = currentPersonalCoins + newlyEarnedCoins;
               
               // Calculate Level (Assumption: 100 coins = 1 level, tweak if needed)
               const newLevel = Math.floor(newTotalCoins / 100) + 1;
               
               // Find matching Title from JSON based on level
               const titleObj = titlesData.find(t => newLevel >= t.minLevel && newLevel <= t.maxLevel);
               const calculatedTitle = titleObj ? titleObj.title : titlesData[0].title;

               if (calculatedTitle !== user.title) {
                 hasNewTitle = true;
                 newTitle = calculatedTitle;
               }

               await updateUser(user.id, { 
                 personal_coins: newTotalCoins,
                 level: newLevel,
                 title: newTitle
               });
               
               user.personal_coins = newTotalCoins;
               user.level = newLevel;
               user.title = newTitle;
               localStorage.setItem(storageKey, JSON.stringify(user));
            }
            
            setMissionResult({
              isCompleted,
              missionName: pendingMission.title || 'this mission', 
              previousPercent: Math.round(currentPercentage),
              newPercent: Math.round(newPercentage),
              gainedPercent: Math.round(newPercentage) - Math.round(currentPercentage),
              newlyEarnedCoins: newlyEarnedCoins,
              hasNewTitle,
              newTitle
            });
            setShowMissionModal(true);
          }
        }
      } catch (error) {
        console.error("Error checking/updating mission:", error);
      } finally {
        setIsCheckingMission(false);
      }
    };

    checkAndCompleteMission();
  }, [practiceId, practiceType, score]);

  return (
    <Spin spinning={isCheckingMission} tip="Checking your mission progress..." size="large">
      <Flex justify="center" align="center" gap={80} wrap="wrap" style={{ minHeight: '80vh', padding: '40px 20px' }}>
        
        <Flex vertical align="center" gap="large">
          <img 
            src={rating.img} 
            alt={rating.title} 
            style={{ width: 350, height: 350, objectFit: 'cover', borderRadius: 16, boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }} 
          />
          <Title level={2} style={{ margin: 0 }}> {rating.title}: {score}/100</Title>        
          
          {resultMessage && (
            <Text style={{ fontSize: 18, marginTop: 10, textAlign: 'center', maxWidth: 400, color: '#555' }}>
              {resultMessage}
            </Text>
          )}

          <Flex gap="middle" style={{ marginTop: 20 }}>
            <Button size="large" onClick={onBack} disabled={isCheckingMission}>{backText}</Button>
            <Button size="large" type="primary" onClick={onRestart} disabled={isCheckingMission}>{restartText}</Button>
          </Flex>
        </Flex>

        <Flex vertical gap="middle" align="center">
          <Text strong style={{ fontSize: 20, display: 'block', marginBottom: 8 }}>Ranking Levels</Text>
          <Flex vertical gap="small" style={{ maxHeight: '600px', overflowY: 'auto', paddingRight: 10 }}>
            {ALL_LEVELS.map(lvl => (
              <Card key={lvl.title} size="small" style={{ 
                  width: 250, 
                  opacity: rating.title === lvl.title ? 1 : 0.5,
                  borderColor: rating.title === lvl.title ? '#1677ff' : '#f0f0f0',
                  backgroundColor: rating.title === lvl.title ? '#f0f5ff' : '#ffffff'
                }}>
                <Flex align="center" gap="middle">
                  <img src={lvl.img} alt={lvl.title} style={{ width: 50, height: 50, objectFit: 'cover', borderRadius: 8 }} />
                  <Flex vertical>
                    <Text strong>{lvl.title}</Text>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      {lvl.min === lvl.max ? '100' : `${lvl.min}-${lvl.max}`} pts
                    </Text>
                  </Flex>
                </Flex>
              </Card>
            ))}
          </Flex>
        </Flex>
      </Flex>

      <Modal
        open={showMissionModal}
        centered
        width={600}
        closable={false}
        maskClosable={false}
        footer={[<Button key="awesome" type="primary" size="large" onClick={() => setShowMissionModal(false)}>Awesome!</Button>]}
      >
        <Result
          status="success"
          title={missionResult?.isCompleted ? "🎉 Thưởng Nhiệm Vụ! 🎉" : "🚀 Thưởng Nhiệm Vụ! 🚀"}
          subTitle={
            <div style={{ marginTop: 20 }}>
              {/* TITLE COMPLIMENT UI */}
              {missionResult?.hasNewTitle && (
                <div style={{ padding: '15px', background: '#fffbe6', border: '1px solid #ffe58f', borderRadius: '8px', marginBottom: '20px' }}>
                  <Text style={{ fontSize: 20, display: 'block', color: '#faad14', fontWeight: 'bold' }}>
                    🌟 Incredible! You've been promoted to Title: {missionResult.newTitle}! 🌟
                  </Text>
                </div>
              )}

              {missionResult?.gainedPercent > 0 && (
                <Text style={{ fontSize: 18, display: 'block', marginBottom: 10, color: '#52c41a', fontWeight: 'bold' }}>
                  📈 +{missionResult.gainedPercent} Points Gained!
                </Text>
              )}

              {missionResult?.newlyEarnedCoins > 0 && (
                <Text style={{ fontSize: 18, display: 'block', marginBottom: 20, color: '#faad14', fontWeight: 'bold' }}>
                  💰 You earned {missionResult.newlyEarnedCoins} coins!
                </Text>
              )}

              <Flex vertical gap="small">
                <Text type="secondary">Your Progress:</Text>
                <Progress
                  percent={missionResult?.newPercent}
                  success={{ percent: missionResult?.previousPercent }}
                  status={missionResult?.isCompleted ? "success" : "active"}
                  size={['100%', 20]}
                />
              </Flex>
            </div>
          }
        />
      </Modal>
    </Spin>
  );
};

export default SessionResult;