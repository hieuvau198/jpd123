import { db } from './firebase-config';
import { collection, getDocs, doc, addDoc, updateDoc, deleteDoc, query, where, serverTimestamp } from 'firebase/firestore';

const COLLECTION_NAME = 'missions';

// Simple in-memory cache to prevent redundant Firebase queries
const missionCache = {};

export const getUserMissions = async (userId, forceRefresh = false) => {
  // 1. Return cached result if available and we aren't forcing a refresh
  if (!forceRefresh && missionCache[userId]) {
    return missionCache[userId];
  }

  try {
    const q = query(collection(db, COLLECTION_NAME), where("userId", "==", userId));
    const querySnapshot = await getDocs(q);
    const missions = [];
    querySnapshot.forEach((doc) => {
      missions.push({ id: doc.id, ...doc.data() });
    });
    
    const sortedMissions = missions.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
    
    // 2. Save fetched data to cache
    missionCache[userId] = sortedMissions;
    
    return sortedMissions;
  } catch (error) {
    console.error("Error fetching missions:", error);
    return [];
  }
};

export const createMission = async (missionData) => {
  try {
    const payload = {
      ...missionData,
      createdAt: serverTimestamp(),
    };
    const docRef = await addDoc(collection(db, COLLECTION_NAME), payload);
    
    // 3. Invalidate cache for the user so next load fetches fresh data
    if (missionData.userId) {
      delete missionCache[missionData.userId];
    }
    
    return { success: true, id: docRef.id };
  } catch (error) {
    console.error("Error creating mission:", error);
    throw error;
  }
};

export const updateMission = async (id, missionData) => {
  try {
    const docRef = doc(db, COLLECTION_NAME, id);
    await updateDoc(docRef, missionData);
    
    // 4. Invalidate cache
    if (missionData.userId) {
      delete missionCache[missionData.userId];
    } else {
      // Clear all cache if we don't explicitly know the user ID
      Object.keys(missionCache).forEach(key => delete missionCache[key]);
    }

    return { success: true };
  } catch (error) {
    console.error("Error updating mission:", error);
    throw error;
  }
};

// Optionally pass userId to deleteMission to target specific cache invalidation
export const deleteMission = async (id, userId = null) => {
  try {
    await deleteDoc(doc(db, COLLECTION_NAME, id));
    
    // 5. Invalidate cache
    if (userId) {
      delete missionCache[userId];
    } else {
      Object.keys(missionCache).forEach(key => delete missionCache[key]);
    }

    return { success: true };
  } catch (error) {
    console.error("Error deleting mission:", error);
    throw error;
  }
};

export const getAllMissions = async () => {
  try {
    const querySnapshot = await getDocs(collection(db, COLLECTION_NAME));
    const missions = [];
    querySnapshot.forEach((doc) => {
      missions.push({ id: doc.id, ...doc.data() });
    });
    return missions;
  } catch (error) {
    console.error("Error fetching all missions:", error);
    return [];
  }
};