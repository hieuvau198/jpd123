import React, { useEffect, useState } from 'react';
import { Button, Typography, Flex, Card, Spin, Modal, Result, Progress } from 'antd';
import { ALL_LEVELS, getRatingInfo } from './flashcard/flashcardConstants';
import { getUserMissions, updateMission } from '../firebase/missionService'; 
import { updateUser } from '../firebase/userService'; 

const { Title, Text } = Typography;

const SessionResult = ({ 
  score, 
  onBack, 
  onRestart, 
  backText = "Back to Menu", 
  restartText = "Play Again", 
  resultMessage,
  practiceId,     
  practiceType    
}) => {
  const rating = getRatingInfo(score);
  
  const [isCheckingMission, setIsCheckingMission] = useState(false);
  const [showMissionModal, setShowMissionModal] = useState(false);
  const [missionResult, setMissionResult] = useState(null);

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

            // FIX: Coin Calculations with proper 0-100 percentage handling
            const maxCoin = pendingMission.maxCoin || 0;
            const currentEarningCoin = pendingMission.earningCoin || 0;
            
            // Multiply by (newPercentage / 100) instead of just newPercentage
            const newEarningCoin = Math.floor((newPercentage / 100) * maxCoin);
            const newlyEarnedCoins = Math.max(0, newEarningCoin - currentEarningCoin);

            const updatePayload = {
              percentage: newPercentage,
              earningCoin: newEarningCoin,
              userId: user.id 
            };

            if (isCompleted) {
              updatePayload.status = 'Đã chinh phục';
              updatePayload.completedAt = new Date();
              if (newEarningCoin < maxCoin) {
                  updatePayload.earningCoin = maxCoin;
              }
            } else {
              updatePayload.status = 'Đang thực hiện'; 
            }

            await updateMission(pendingMission.id, updatePayload);

            if (newlyEarnedCoins > 0) {
               const currentPersonalCoins = user.personal_coins || 0;
               const newTotalCoins = currentPersonalCoins + newlyEarnedCoins;
               
               await updateUser(user.id, { personal_coins: newTotalCoins });
               
               user.personal_coins = newTotalCoins;
               localStorage.setItem(storageKey, JSON.stringify(user));
            }
            
            setMissionResult({
              isCompleted,
              missionName: pendingMission.title || 'this mission', 
              previousPercent: Math.round(currentPercentage),
              newPercent: Math.round(newPercentage),
              gainedPercent: Math.round(newPercentage) - Math.round(currentPercentage), // <-- ADDED: Calculate gained points
              newlyEarnedCoins: newlyEarnedCoins
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
        
        {/* Left Side: Score & Actions */}
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

        {/* Right Side: Ranking List */}
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

      {/* The Big Mission Result Modal */}
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
          title={missionResult?.isCompleted ? "🎉 Mission Conquered! 🎉" : "🚀 Mission Progress Updated! 🚀"}
          subTitle={
            <div style={{ marginTop: 20 }}>
              <Text style={{ fontSize: 18, display: 'block', marginBottom: 10 }}>
                {missionResult?.isCompleted
                  ? `Incredible! You scored ${score} and completely finished ${missionResult?.missionName}.`
                  : `You've reached ${score}% completion! Keep up the great work.`}
              </Text>
              
              {/* NEW: Display gained points side-by-side with coins */}
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