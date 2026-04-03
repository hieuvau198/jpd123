// src/firebase/historyService.js
import { db } from './firebase-config';
import { doc, getDoc, setDoc, collection, getDocs } from 'firebase/firestore';

// Fetch the history for all users
export const getAllHistories = async () => {
  try {
    const querySnapshot = await getDocs(collection(db, 'history'));
    const historiesMap = {};
    querySnapshot.forEach((doc) => {
      historiesMap[doc.id] = doc.data().practices || {};
    });
    return historiesMap;
  } catch (error) {
    console.error("Error fetching all histories:", error);
    return {};
  }
};

// Fetch the history for a specific user
export const getUserHistory = async (userId) => {
  try {
    const historyRef = doc(db, 'history', userId);
    const docSnap = await getDoc(historyRef);
    if (docSnap.exists()) {
      return docSnap.data().practices || {};
    }
    return {};
  } catch (error) {
    console.error("Error getting user history:", error);
    return {};
  }
};

// Update or add a practice to the user's history
export const updateUserHistory = async (userId, practiceData) => {
  try {
    const historyRef = doc(db, 'history', userId);
    const docSnap = await getDoc(historyRef);
    
    let practices = {};
    if (docSnap.exists()) {
      practices = docSnap.data().practices || {};
    }

    const existingPractice = practices[practiceData.id];
    const score = practiceData.score || 0;
    
    // Calculate coins: 200 max for score (score * 2), +50 bonus for 100%
    const calculatedTotalCoins = (score * 2) + (score === 100 ? 50 : 0);
    const existingCoins = existingPractice?.earnedCoins || 0;
    const newlyEarnedCoins = Math.max(0, calculatedTotalCoins - existingCoins);
    const newTotalCoins = existingCoins + newlyEarnedCoins;

    // Update attempts and max score
    practices[practiceData.id] = {
      id: practiceData.id,
      // Retain previous name if not provided, else use new one
      name: practiceData.name || existingPractice?.name || 'Unknown Practice',
      type: practiceData.type || existingPractice?.type || 'Unknown Type',
      // Keep the highest score achieved
      completion: existingPractice ? Math.max(existingPractice.completion, score) : score,
      // Increment attempts
      attempts: existingPractice ? existingPractice.attempts + 1 : 1,
      lastAccessed: new Date().toISOString(),
      earnedCoins: newTotalCoins // Store the total coins earned from this practice
    };

    // Save back to firestore using merge to avoid overwriting other potential fields
    await setDoc(historyRef, { practices }, { merge: true });
    
    return { newlyEarnedCoins, totalCoins: newTotalCoins };
  } catch (error) {
    console.error("Error updating user history:", error);
    return { newlyEarnedCoins: 0, totalCoins: 0 };
  }
};