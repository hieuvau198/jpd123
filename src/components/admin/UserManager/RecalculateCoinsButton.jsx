// src/components/admin/UserManager/RecalculateCoinsButton.jsx
import React, { useState } from 'react';
import { Button, Modal, message } from 'antd';
import { Calculator } from 'lucide-react';
import { updateMission, getAllMissions } from '../../../firebase/missionService';

const RecalculateCoinsButton = ({ missions, onRefresh }) => {
  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);

  // Extracted the core logic so it can accept any array of missions
  const performRecalculation = async (missionsToUpdate) => {
  setLoading(true);
  try {
    // 1. Group missions by User ID
    const missionsByUser = missionsToUpdate.reduce((acc, m) => {
      if (!m.userId) return acc;
      if (!acc[m.userId]) acc[m.userId] = [];
      acc[m.userId].push(m);
      return acc;
    }, {});

    for (const userId in missionsByUser) {
      let userTotalCoins = 0;
      const userMissions = missionsByUser[userId];

      for (const mission of userMissions) {
        let currentPercentage = mission.percentage || 0;
        if (mission.status === 'Đã chinh phục') currentPercentage = 100;

        const targetQuestions = mission.targetQuestions || 0;
        const correctMaxCoins = targetQuestions * 10;
        const correctEarningCoins = Math.floor((correctMaxCoins * currentPercentage) / 100);

        // Update mission if data is stale
        if (mission.max_coins !== correctMaxCoins || mission.earning_coins !== correctEarningCoins) {
          await updateMission(mission.id, {
            max_coins: correctMaxCoins,
            earning_coins: correctEarningCoins,
            percentage: currentPercentage
          });
        }
        userTotalCoins += correctEarningCoins;
      }

      // Sync the sum of all mission earnings to the User record
      await updateUser(userId, { personal_coins: userTotalCoins });
    }

    message.success("Recalculation and User balances updated.");
    if (onRefresh) onRefresh();
  } catch (error) {
    console.error(error);
    message.error("Failed to recalculate.");
  } finally {
    setLoading(false);
  }
};

  const handleRecalculateCurrent = () => {
    performRecalculation(missions);
  };

  const handleRecalculateAll = async () => {
    setLoading(true);
    try {
      const allMissions = await getAllMissions();
      await performRecalculation(allMissions);
    } catch (error) {
      console.error("Failed to fetch all missions:", error);
      message.error("Failed to fetch all missions.");
      setLoading(false);
    }
  };

  return (
    <>
      <Button 
        icon={<Calculator size={16} />} 
        onClick={() => setIsModalVisible(true)}
      >
        Recalculate Coins
      </Button>

      <Modal
        title="Recalculate Coins"
        open={isModalVisible}
        onCancel={() => !loading && setIsModalVisible(false)}
        closable={!loading}
        maskClosable={!loading}
        footer={[
          <Button 
            key="cancel" 
            disabled={loading} 
            onClick={() => setIsModalVisible(false)}
          >
            Cancel
          </Button>,
          <Button 
            key="current" 
            type="primary" 
            loading={loading} 
            onClick={handleRecalculateCurrent}
          >
            Only This Student
          </Button>,
          <Button 
            key="all" 
            type="primary" 
            danger 
            loading={loading} 
            onClick={handleRecalculateAll}
          >
            All Students
          </Button>,
        ]}
      >
        <p>Do you want to recalculate coins for just this student's missions, or for all missions across all students in the system?</p>
        <p style={{ color: '#faad14', fontSize: '13px', marginTop: '10px' }}>
          <strong>Note:</strong> Recalculating all students might take some time depending on the total number of missions.
        </p>
      </Modal>
    </>
  );
};

export default RecalculateCoinsButton;