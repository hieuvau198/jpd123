import { db } from './firebase-config';
import { collection, getDocs, doc, setDoc, deleteDoc, getDoc } from 'firebase/firestore';

const COLLECTION_NAME = 'repairs';

export const getAllRepairs = async () => {
  try {
    const querySnapshot = await getDocs(collection(db, COLLECTION_NAME));
    const repairs = [];
    querySnapshot.forEach((doc) => {
      repairs.push({ ...doc.data(), id: doc.id, type: 'repair' });
    });
    return repairs;
  } catch (error) {
    console.error("Error fetching repairs:", error);
    return [];
  }
};

export const getRepairById = async (id) => {
  try {
    const docRef = doc(db, COLLECTION_NAME, id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { ...docSnap.data(), id: docSnap.id, type: 'repair' };
    }
    return null;
  } catch (error) {
    console.error("Error getting repair:", error);
    return null;
  }
};

export const saveRepairSet = async (data) => {
  try {
    if (!data.id) throw new Error("Repair data must have an 'id' field.");
    
    const docRef = doc(db, COLLECTION_NAME, data.id);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return { success: false, message: 'ID already exists' };
    }

    const payload = { ...data, type: 'repair' };
    await setDoc(docRef, payload);
    return { success: true, message: 'Saved successfully' };
  } catch (error) {
    console.error("Error saving repair:", error);
    throw error;
  }
};

export const deleteRepairSet = async (id) => {
  try {
    await deleteDoc(doc(db, COLLECTION_NAME, id));
    return true;
  } catch (error) {
    console.error("Error deleting repair:", error);
    throw error;
  }
};