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
    let updatedCount = 0;

    try {
      for (const mission of missionsToUpdate) {
        let needsUpdate = false;
        const updates = {};

        // 1. Correct percentage if mission is completed
        let currentPercentage = mission.percentage || 0;
        if (mission.status === 'Đã chinh phục' && currentPercentage !== 100) {
          currentPercentage = 100;
          updates.percentage = 100;
          needsUpdate = true;
        }

        // 2. Recalculate Max Coins (target_questions * 10)
        const targetQuestions = mission.targetQuestions || 0;
        const correctMaxCoins = targetQuestions * 10;
        if (mission.max_coins !== correctMaxCoins) {
          updates.max_coins = correctMaxCoins;
          needsUpdate = true;
        }

        // 3. Recalculate Earning Coins ((max_coins * percentage) / 100)
        const correctEarningCoins = Math.floor((correctMaxCoins * currentPercentage) / 100);
        if (mission.earning_coins !== correctEarningCoins) {
          updates.earning_coins = correctEarningCoins;
          needsUpdate = true;
        }

        // Only fire an update if something actually changed
        if (needsUpdate) {
          await updateMission(mission.id, updates);
          updatedCount++;
        }
      }

      message.success(`Recalculation complete. Updated ${updatedCount} missions.`);
      if (updatedCount > 0 && onRefresh) {
        onRefresh();
      }
    } catch (error) {
      console.error("Error recalculating coins:", error);
      message.error("Failed to recalculate coins.");
    } finally {
      setLoading(false);
      setIsModalVisible(false); // Close modal when done
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