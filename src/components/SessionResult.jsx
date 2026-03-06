import React, { useEffect } from 'react';
import { Button, Typography, Flex, Card, message } from 'antd';
import { ALL_LEVELS, getRatingInfo } from './flashcard/flashcardConstants';
import { getUserMissions, updateMission } from '../firebase/missionService'; // Import mission services

const { Title, Text } = Typography;

// Added practiceId and practiceType to props
const SessionResult = ({ 
  score, 
  onBack, 
  onRestart, 
  backText = "Back to Menu", 
  restartText = "Play Again", 
  resultMessage,
  practiceId,     // <--- NEW: e.g., 'flashcard_123' or 'quiz_456'
  practiceType    // <--- NEW: e.g., 'flashcard', 'quiz'
}) => {
  const rating = getRatingInfo(score);

  useEffect(() => {
    const checkAndCompleteMission = async () => {
      // 1. Ignore if it's not a flashcard or quiz, or if no ID is provided
      if (!practiceId || !['Flashcard', 'Quiz'].includes(practiceType)) {
        return;
      }

      try {
        // 2. Get the logged-in user
        const userStr = localStorage.getItem('userSession') || localStorage.getItem('user');
        if (!userStr) return;
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
          // Calculate new percentage (e.g., 80 / 100 = 0.8)
          const newPercentage = score / 100;
          
          // Only update if the new score is better than their previous progress
          const currentPercentage = pendingMission.percentage || 0;
          
          if (newPercentage > currentPercentage) {
            const isCompleted = newPercentage >= 1.0; // Assuming 100% is required to complete

            const updatePayload = {
              percentage: newPercentage,
              userId: user.id // Pass userId to updateMission so it clears the cache for this user
            };

            // If they reached 100%, mark as complete and set the completion date
            if (isCompleted) {
              updatePayload.status = 'Đã chinh phục';
              updatePayload.completedAt = new Date();
            } else {
              updatePayload.status = 'Đang thực hiện'; // Make sure it stays pending if < 100%
            }

            await updateMission(pendingMission.id, updatePayload);
            
            // Show appropriate message to the user
            if (isCompleted) {
              message.success('Mission Completed! 🎉');
            } else {
              message.info(`Mission progress updated to ${score}%! Keep going!`);
            }
          }
        }
      } catch (error) {
        console.error("Error checking/updating mission:", error);
      }
    };

    checkAndCompleteMission();
  }, [practiceId, practiceType, score]); // Added `score` to dependency array

  return (
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
        {/* Render the result message if it exists */}
        {resultMessage && (
          <Text style={{ fontSize: 18, marginTop: 10, textAlign: 'center', maxWidth: 400, color: '#555' }}>
            {resultMessage}
          </Text>
        )}

        <Flex gap="middle" style={{ marginTop: 20 }}>
          <Button size="large" onClick={onBack}>
            {backText}
          </Button>
          <Button size="large" type="primary" onClick={onRestart}>
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
  );
};

export default SessionResult;