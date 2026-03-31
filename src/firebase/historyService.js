// src/firebase/historyService.js
import { db } from './firebase-config';
import { doc, getDoc, setDoc } from 'firebase/firestore';

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
    
    // Update attempts and max score
    practices[practiceData.id] = {
      id: practiceData.id,
      // Retain previous name if not provided, else use new one
      name: practiceData.name || existingPractice?.name || 'Unknown Practice',
      type: practiceData.type || existingPractice?.type || 'Unknown Type',
      // Keep the highest score achieved
      completion: existingPractice ? Math.max(existingPractice.completion, practiceData.score) : practiceData.score,
      // Increment attempts
      attempts: existingPractice ? existingPractice.attempts + 1 : 1,
      lastAccessed: new Date().toISOString()
    };

    // Save back to firestore using merge to avoid overwriting other potential fields
    await setDoc(historyRef, { practices }, { merge: true });
  } catch (error) {
    console.error("Error updating user history:", error);
  }
};