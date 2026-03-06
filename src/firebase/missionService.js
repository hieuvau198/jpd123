import { db } from './firebase-config';
import { collection, getDocs, doc, addDoc, updateDoc, deleteDoc, query, where, serverTimestamp } from 'firebase/firestore';

const COLLECTION_NAME = 'missions';

export const getUserMissions = async (userId) => {
  try {
    const q = query(collection(db, COLLECTION_NAME), where("userId", "==", userId));
    const querySnapshot = await getDocs(q);
    const missions = [];
    querySnapshot.forEach((doc) => {
      missions.push({ id: doc.id, ...doc.data() });
    });
    return missions.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
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
    return { success: true };
  } catch (error) {
    console.error("Error updating mission:", error);
    throw error;
  }
};

export const deleteMission = async (id) => {
  try {
    await deleteDoc(doc(db, COLLECTION_NAME, id));
    return { success: true };
  } catch (error) {
    console.error("Error deleting mission:", error);
    throw error;
  }
};