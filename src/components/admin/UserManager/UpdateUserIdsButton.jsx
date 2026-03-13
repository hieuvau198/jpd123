// src/components/admin/UserManager/UpdateUserIdsButton.jsx
import React, { useState } from 'react';
import { Button, Popconfirm, message } from 'antd';
import { RefreshCw } from 'lucide-react';
import { db } from '../../../firebase/firebase-config';
import { collection, getDocs, doc, setDoc, deleteDoc, updateDoc, query, where } from 'firebase/firestore';

const UpdateUserIdsButton = ({ onComplete }) => {
  const [loading, setLoading] = useState(false);

  const handleUpdateIds = async () => {
    setLoading(true);
    try {
      const usersRef = collection(db, 'users');
      const snapshot = await getDocs(usersRef);
      
      let count = 0;

      for (const userDoc of snapshot.docs) {
        const userData = userDoc.data();
        const oldId = userDoc.id;
        const newId = userData.username ? userData.username.trim() : null;

        // Only migrate if there's a username and the ID isn't already the username
        if (newId && oldId !== newId) {
          
          // 1. Create new doc reference with the username as ID
          const newDocRef = doc(db, 'users', newId);
          await setDoc(newDocRef, userData);
          
          // 2. Update any related missions that belong to this user 
          // (This prevents users from losing their missions when their ID changes)
          const missionsRef = collection(db, 'missions');
          const missionQuery = query(missionsRef, where("userId", "==", oldId));
          const missionSnap = await getDocs(missionQuery);
          
          for (const mDoc of missionSnap.docs) {
            await updateDoc(doc(db, 'missions', mDoc.id), { userId: newId });
          }

          // 3. Delete the old user doc
          const oldDocRef = doc(db, 'users', oldId);
          await deleteDoc(oldDocRef);
          
          count++;
        }
      }

      message.success(`Successfully migrated ${count} user IDs!`);
      if (onComplete) {
        onComplete(); // Refresh the table
      }
    } catch (error) {
      console.error("Error updating user IDs:", error);
      message.error("Failed to update user IDs.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Popconfirm
      title="Migrate User IDs?"
      description="This changes all user IDs to their usernames and updates their missions. Proceed?"
      onConfirm={handleUpdateIds}
      okText="Yes, Update"
      cancelText="Cancel"
      placement="bottomRight"
    >
      <Button 
        type="default" 
        icon={<RefreshCw size={16} />} 
        loading={loading}
      >
        IDs
      </Button>
    </Popconfirm>
  );
};

export default UpdateUserIdsButton;