import React, { useEffect, useState } from 'react';
import { Button, Typography, Flex, Card, Spin, Modal, Result, Progress } from 'antd';
import { ALL_LEVELS, getRatingInfo } from './flashcard/flashcardConstants';
import { getUserMissions, updateMission } from '../firebase/missionService'; 

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
  
  // New states for loading and the "big view" modal
  const [isCheckingMission, setIsCheckingMission] = useState(false);
  const [showMissionModal, setShowMissionModal] = useState(false);
  const [missionResult, setMissionResult] = useState(null);

  useEffect(() => {
    const checkAndCompleteMission = async () => {
      // 1. Ignore if it's not a flashcard or quiz, or if no ID is provided
      if (!practiceId || !['Flashcard', 'Quiz', 'Phonetic', 'Repair'].includes(practiceType)) {
        return;
      }

      setIsCheckingMission(true); // Start loading

      try {
        // 2. Get the logged-in user
        const userStr = localStorage.getItem('userSession') || localStorage.getItem('user');
        if (!userStr) {
          setIsCheckingMission(false);
          return;
        }
        const user = JSON.parse(userStr);

        // 3. Fetch user's missions
        const missions = await getUserMissions(user.id, true); 

        // 4. Find a matching mission that hasn't been fully completed yet
        const pendingMission = missions.find(m => {
          const matchesId = m.practiceId === practiceId || m.flashcardId === practiceId || m.quizId === practiceId;
          const isPending = m.status !== 'Đã chinh phục'; 
          
          return matchesId && isPending;
        });

        // 5. If a matching pending mission exists, update its progress
        if (pendingMission) {
          const newPercentage = score / 100;
          const currentPercentage = pendingMission.percentage || 0;
          
          if (newPercentage > currentPercentage) {
            const isCompleted = newPercentage >= 1.0;

            const updatePayload = {
              percentage: newPercentage,
              userId: user.id 
            };

            if (isCompleted) {
              updatePayload.status = 'Đã chinh phục';
              updatePayload.completedAt = new Date();
            } else {
              updatePayload.status = 'Đang thực hiện'; 
            }

            await updateMission(pendingMission.id, updatePayload);
            
            // Save the result and show the big modal instead of a small message
            setMissionResult({
              isCompleted,
              missionName: pendingMission.title || 'this mission', // use title if available
              previousPercent: Math.round(currentPercentage * 100),
              newPercent: Math.round(newPercentage * 100)
            });
            setShowMissionModal(true);
          }
        }
      } catch (error) {
        console.error("Error checking/updating mission:", error);
      } finally {
        setIsCheckingMission(false); // Stop loading no matter what
      }
    };

    checkAndCompleteMission();
  }, [practiceId, practiceType, score]);

  return (
    // Wrap the entire component in a Spin to show a loading overlay and block clicks
    <Spin 
      spinning={isCheckingMission} 
      tip="Checking your mission progress..." 
      size="large"
    >
      <Flex justify="center" align="center" gap={80} wrap="wrap" style={{ minHeight: '80vh', padding: '40px 20px' }}>
        
        {/* Left Side: Score & Actions */}
        <Flex vertical align="center" gap="large">
          <img 
            src={rating.img} 
            alt={rating.title} 
            style={{ 
                width: 350, 
                height: 350, 
                objectFit: 'cover', 
                borderRadius: 16, 
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)' 
              }} 
          />

          <Title level={2} style={{ margin: 0 }}> {rating.title}: {score}/100</Title>        
          
          {resultMessage && (
            <Text style={{ fontSize: 18, marginTop: 10, textAlign: 'center', maxWidth: 400, color: '#555' }}>
              {resultMessage}
            </Text>
          )}

          <Flex gap="middle" style={{ marginTop: 20 }}>
            <Button size="large" onClick={onBack} disabled={isCheckingMission}>
              {backText}
            </Button>
            <Button size="large" type="primary" onClick={onRestart} disabled={isCheckingMission}>
              {restartText}
            </Button>
          </Flex>
        </Flex>

        {/* Right Side: Ranking List (Top-Down) */}
        <Flex vertical gap="middle" align="center">
          <Text strong style={{ fontSize: 20, display: 'block', marginBottom: 8 }}>
            Ranking Levels
          </Text>
          <Flex vertical gap="small" style={{ maxHeight: '600px', overflowY: 'auto', paddingRight: 10 }}>
            {ALL_LEVELS.map(lvl => (
              <Card 
                key={lvl.title} 
                size="small" 
                style={{ 
                  width: 250, 
                  opacity: rating.title === lvl.title ? 1 : 0.5,
                  borderColor: rating.title === lvl.title ? '#1677ff' : '#f0f0f0',
                  backgroundColor: rating.title === lvl.title ? '#f0f5ff' : '#ffffff'
                }}
              >
                <Flex align="center" gap="middle">
                  <img 
                    src={lvl.img} 
                    alt={lvl.title} 
                    style={{ 
                      width: 50, 
                      height: 50, 
                      objectFit: 'cover', 
                      borderRadius: 8
                    }} 
                  />
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
        maskClosable={false} // Force them to acknowledge it
        footer={[
          <Button 
            key="awesome" 
            type="primary" 
            size="large" 
            onClick={() => setShowMissionModal(false)}
          >
            Awesome!
          </Button>
        ]}
      >
        <Result
          status="success"
          title={missionResult?.isCompleted ? "🎉 Mission Conquered! 🎉" : "🚀 Mission Progress Updated! 🚀"}
          subTitle={
            <div style={{ marginTop: 20 }}>
              <Text style={{ fontSize: 18, display: 'block', marginBottom: 20 }}>
                {missionResult?.isCompleted
                  ? `Incredible! You scored ${score} and completely finished ${missionResult?.missionName}.`
                  : `You've reached ${score}% completion! Keep up the great work.`}
              </Text>
              
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