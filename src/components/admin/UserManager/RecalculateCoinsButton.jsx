// src/components/admin/UserManager/RecalculateCoinsButton.jsx
import React, { useState } from 'react';
import { Button, Popconfirm, message } from 'antd';
import { Calculator } from 'lucide-react';
import { updateMission } from '../../../firebase/missionService';

const RecalculateCoinsButton = ({ missions, onRefresh }) => {
  const [loading, setLoading] = useState(false);

  const handleRecalculate = async () => {
    setLoading(true);
    let updatedCount = 0;

    try {
      for (const mission of missions) {
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
    }
  };

  return (
    <Popconfirm
      title="Recalculate Coins"
      description="Are you sure you want to recalculate coins for all missions shown here?"
      onConfirm={handleRecalculate}
      okText="Yes"
      cancelText="No"
    >
      <Button icon={<Calculator size={16} />} loading={loading}>
        Recalculate Coins
      </Button>
    </Popconfirm>
  );
};

export default RecalculateCoinsButton;