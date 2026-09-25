// src/components/SessionResult.jsx
import React, { useEffect, useState } from 'react';
import { Button, Typography, Flex, Card, Spin, Modal, Result, Progress, Tag } from 'antd';
import { ALL_LEVELS, getRatingInfo } from './flashcard/wordConstants';
import { getUserMissions, updateMission } from '../firebase/missionService';
import { updateUser } from '../firebase/userService';
import { updateUserHistory } from '../firebase/historyService';
import titlesData from '../data/system/titles.json';

const { Title, Text } = Typography;

const SessionResult = ({
  score,
  onBack,
  onRestart,
  backText = "Trang chính",
  restartText = "Làm lại",
  resultMessage,
  practiceId,
  practiceType,
  practiceName
}) => {
  const rating = getRatingInfo(score);
  const [isCheckingMission, setIsCheckingMission] = useState(false);
  const [showMissionModal, setShowMissionModal] = useState(false);
  const [missionResult, setMissionResult] = useState(null);
  const [practiceCoinsEarned, setPracticeCoinsEarned] = useState(0);

  // Retrieve user information for display
  const [userFullName, setUserFullName] = useState('');

  useEffect(() => {
    try {
      const storageKey = localStorage.getItem('userSession') ? 'userSession' : 'user';
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        const parsed = JSON.parse(stored);
        setUserFullName(parsed.name || parsed.username || '');
      }
    } catch (e) {
      console.error("Failed to read user name", e);
    }
  }, []);

  useEffect(() => {
    const processResults = async () => {
      if (!practiceId || !practiceType) return;

      setIsCheckingMission(true);
      try {
        const storageKey = localStorage.getItem('userSession') ? 'userSession' : 'user';
        const userStr = localStorage.getItem(storageKey);

        if (!userStr) {
          setIsCheckingMission(false);
          return;
        }
        let user = JSON.parse(userStr);

        // 1. Process History & Practice Coins
        const historyResult = await updateUserHistory(user.id, {
          id: practiceId,
          name: practiceName || `${practiceType} Practice`,
          type: practiceType,
          score: score
        });

        let historyEarned = 0;
        if (historyResult && historyResult.newlyEarnedCoins > 0) {
          historyEarned = historyResult.newlyEarnedCoins;
          setPracticeCoinsEarned(historyEarned);
        }

        // 2. Process Mission Coins
        let missionEarned = 0;
        let missionResultData = null;
        let updatePayload = null;
        let pendingMission = null;

        if (['Flashcard', 'Quiz', 'Phonetic', 'Repair', 'Chem Quiz', 'Reading'].includes(practiceType)) {
  const missions = await getUserMissions(user.id, true);
  pendingMission = missions.find(m => {
    const matchesId = m.practiceId === practiceId || m.readingId === practiceId;
    const isPending = m.status !== 'đã chinh phục';
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

              missionEarned = newlyEarnedCoins;
              const newTotalEarningCoins = currentEarningCoins + newlyEarnedCoins;
              updatePayload = {
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

              missionResultData = {
                isCompleted,
                missionName: pendingMission.title || 'this mission',
                previousPercent: Math.round(currentPercentage),
                newPercent: Math.round(newPercentage),
                gainedPercent: Math.round(newPercentage) - Math.round(currentPercentage),
                newlyEarnedCoins: newlyEarnedCoins,
                hasNewTitle: false,
                newTitle: user.title
              };
            }
          }
        }

        // 3. Update User Total Coins
        const totalNewlyEarnedCoins = historyEarned + missionEarned;
        if (totalNewlyEarnedCoins > 0) {
          const currentPersonalCoins = user.personal_coins || 0;
          const newTotalCoins = currentPersonalCoins + totalNewlyEarnedCoins;
          const newLevel = Math.floor(newTotalCoins / 100) + 1;

          const titleObj = titlesData.find(t => newLevel >= t.minLevel && newLevel <= t.maxLevel);
          const calculatedTitle = titleObj ? titleObj.title : titlesData[0].title;

          if (calculatedTitle !== user.title) {
            if (missionResultData) {
              missionResultData.hasNewTitle = true;
              missionResultData.newTitle = calculatedTitle;
            }
          }

          await updateUser(user.id, {
            personal_coins: newTotalCoins,
            level: newLevel,
            title: calculatedTitle
          });

          user.personal_coins = newTotalCoins;
          user.level = newLevel;
          user.title = calculatedTitle;
          localStorage.setItem(storageKey, JSON.stringify(user));
        }

        // 4. Update Mission Doc & Trigger Modal
        if (pendingMission && updatePayload) {
          await updateMission(pendingMission.id, updatePayload);
          setMissionResult(missionResultData);
          setShowMissionModal(true);
        }
      } catch (error) {
        console.error("Error processing session results:", error);
      } finally {
        setIsCheckingMission(false);
      }
    };

    processResults();
  }, [practiceId, practiceType, practiceName, score]);

  // Formatted header string: "[User Name] - [Practice Name]"
  const formattedPracticeHeader = [userFullName, practiceName || `${practiceType} Practice`]
    .filter(Boolean)
    .join(' - ');

  return (
    <Spin spinning={isCheckingMission} tip="Saving your progress..." size="large">
      <div className="min-h-screen flex items-center justify-center p-4 sm:p-8">
        {/* Isolated Session Result Card Frame */}
        <div 
          style={{
            maxWidth: 1000,
            width: '100%',
            backgroundColor: 'rgba(255, 255, 255, 0.96)',
            backdropFilter: 'blur(16px)',
            borderRadius: 24,
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.12)',
            border: '1px solid rgba(255, 255, 255, 0.6)',
            padding: '40px 32px'
          }}
        >
          <Flex justify="center" align="center" gap={60} wrap="wrap">
            {/* Left Side: Performance Summary */}
            <Flex vertical align="center" gap="large">
              <img
                src={rating.img}
                alt={rating.title}
                style={{
                  width: 320,
                  height: 320,
                  objectFit: 'cover',
                  borderRadius: 20,
                  boxShadow: '0 8px 24px rgba(0,0,0,0.12)'
                }}
              />
              {formattedPracticeHeader && (
                <Title level={4} style={{ margin: 0, color: '#1890ff', textAlign: 'center' }}>
                  {formattedPracticeHeader}
                </Title>
              )}
              <Title level={2} style={{ margin: 0, color: '#1f1f1f' }}>
                {rating.title}: {score}/100
              </Title>
              {practiceCoinsEarned > 0 && (
                <Tag color="gold" style={{ fontSize: 16, padding: '4px 16px', marginTop: 4, borderRadius: 20 }}>
                  +{practiceCoinsEarned} Coins Earned!
                </Tag>
              )}
              {resultMessage && (
                <Text style={{ fontSize: 16, marginTop: 8, textAlign: 'center', maxWidth: 380, color: '#595959' }}>
                  {resultMessage}
                </Text>
              )}
              <Flex gap="middle" style={{ marginTop: 16 }}>
                <Button size="large" onClick={onBack} disabled={isCheckingMission}>
                  {backText}
                </Button>
                <Button size="large" type="primary" onClick={onRestart} disabled={isCheckingMission}>
                  {restartText}
                </Button>
              </Flex>
            </Flex>

            {/* Right Side: Tier Badges */}
            <Flex vertical gap="middle" align="center">
              <Text strong style={{ fontSize: 18, display: 'block', marginBottom: 6, color: '#262626' }}>
                Ranking Levels
              </Text>
              <Flex vertical gap="small" style={{ maxHeight: '520px', overflowY: 'auto', paddingRight: 8 }}>
                {ALL_LEVELS.map(lvl => (
                  <Card
                    key={lvl.title}
                    size="small"
                    style={{
                      width: 260,
                      opacity: rating.title === lvl.title ? 1 : 0.6,
                      borderColor: rating.title === lvl.title ? '#1677ff' : '#e8e8e8',
                      backgroundColor: rating.title === lvl.title ? '#f0f5ff' : '#ffffff',
                      boxShadow: rating.title === lvl.title ? '0 4px 12px rgba(22, 119, 255, 0.15)' : 'none',
                      borderRadius: 12
                    }}
                  >
                    <Flex align="center" gap="middle">
                      <img
                        src={lvl.img}
                        alt={lvl.title}
                        style={{ width: 48, height: 48, objectFit: 'cover', borderRadius: 8 }}
                      />
                      <Flex vertical>
                        <Text strong style={{ color: '#262626' }}>{lvl.title}</Text>
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
        </div>
      </div>

      <Modal
        open={showMissionModal}
        centered
        width={600}
        closable={false}
        maskClosable={false}
        footer={[
          <Button key="awesome" type="primary" size="large" onClick={() => setShowMissionModal(false)}>
            Awesome!
          </Button>
        ]}
      >
        <Result
          status="success"
          title={missionResult?.isCompleted ? "Hoàn thành nhiệm vụ!" : "Tiến trình nhiệm vụ"}
          subTitle={
            <div style={{ marginTop: 20 }}>
              {missionResult?.hasNewTitle && (
                <div style={{ padding: '15px', background: '#fffbe6', border: '1px solid #ffe58f', borderRadius: '8px', marginBottom: '20px' }}>
                  <Text style={{ fontSize: 20, display: 'block', color: '#faad14', fontWeight: 'bold' }}>
                    Incredible! You've been promoted to Title: {missionResult.newTitle}!
                  </Text>
                </div>
              )}
              {missionResult?.gainedPercent > 0 && (
                <Text style={{ fontSize: 18, display: 'block', marginBottom: 10, color: '#52c41a', fontWeight: 'bold' }}>
                  +{missionResult.gainedPercent} Points Gained!
                </Text>
              )}
              {missionResult?.newlyEarnedCoins > 0 && (
                <Text style={{ fontSize: 18, display: 'block', marginBottom: 20, color: '#faad14', fontWeight: 'bold' }}>
                  You earned {missionResult.newlyEarnedCoins} coins from this mission!
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