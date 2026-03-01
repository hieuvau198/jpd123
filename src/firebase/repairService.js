import { db } from './firebase-config';
import { collection, getDocs, doc, setDoc, deleteDoc, getDoc } from 'firebase/firestore';

const COLLECTION_NAME = 'repairs';

// --- IN-MEMORY CACHE ---
const cache = {
  all: null,
  byTag: {}, // Added for structural consistency in case you add getRepairsByTag later
  byId: {}
};

export const clearRepairCache = () => {
  cache.all = null;
  cache.byTag = {};
  cache.byId = {};
};

export const getAllRepairs = async () => {
  if (cache.all) return cache.all; // Return cached data if available

  try {
    const querySnapshot = await getDocs(collection(db, COLLECTION_NAME));
    const repairs = [];
    querySnapshot.forEach((doc) => {
      const data = { ...doc.data(), id: doc.id, type: 'repair' };
      repairs.push(data);
      cache.byId[doc.id] = data; // Cache individual items
    });
    
    cache.all = repairs; // Save to cache
    return repairs;
  } catch (error) {
    console.error("Error fetching repairs:", error);
    return [];
  }
};

export const getRepairById = async (id) => {
  if (cache.byId[id]) return cache.byId[id]; // Instant load if cached

  try {
    const docRef = doc(db, COLLECTION_NAME, id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const data = { ...docSnap.data(), id: docSnap.id, type: 'repair' };
      cache.byId[id] = data; // Save to cache
      return data;
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
    
    clearRepairCache(); // Invalidate cache on write

    return { success: true, message: 'Saved successfully' };
  } catch (error) {
    console.error("Error saving repair:", error);
    throw error;
  }
};

export const deleteRepairSet = async (id) => {
  try {
    await deleteDoc(doc(db, COLLECTION_NAME, id));
    
    clearRepairCache(); // Invalidate cache on delete

    return true;
  } catch (error) {
    console.error("Error deleting repair:", error);
    throw error;
  }
};