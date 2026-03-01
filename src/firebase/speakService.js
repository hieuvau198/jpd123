import { db } from './firebase-config';
import { collection, getDocs, doc, setDoc, deleteDoc, getDoc } from 'firebase/firestore';

const COLLECTION_NAME = 'speaks';

// --- IN-MEMORY CACHE ---
const cache = {
  all: null,
  byTag: {}, // Added for structural consistency in case you add getSpeaksByTag later
  byId: {}
};

export const clearSpeakCache = () => {
  cache.all = null;
  cache.byTag = {};
  cache.byId = {};
};

/**
 * Fetches all speak sets from Firestore.
 */
export const getAllSpeaks = async () => {
  if (cache.all) return cache.all; // Return cached data if available

  try {
    const querySnapshot = await getDocs(collection(db, COLLECTION_NAME));
    const speaks = [];
    querySnapshot.forEach((doc) => {
      const data = { ...doc.data(), id: doc.id, type: 'speak' };
      speaks.push(data);
      cache.byId[doc.id] = data; // Cache individual items
    });
    
    cache.all = speaks; // Save to cache
    return speaks;
  } catch (error) {
    console.error("Error fetching speaks:", error);
    return [];
  }
};

/**
 * Saves a speak set.
 */
export const saveSpeakSet = async (data) => {
  try {
    if (!data.id) throw new Error("Speak data must have an 'id' field.");
    
    const docRef = doc(db, COLLECTION_NAME, data.id);
    
    // Check if it exists
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { success: false, message: 'ID already exists' };
    }

    // Ensure the data saved has the type 'speak'
    const payload = { ...data, type: 'speak' };
    
    await setDoc(docRef, payload);
    
    clearSpeakCache(); // Invalidate cache on write

    return { success: true, message: 'Saved successfully' };
  } catch (error) {
    console.error("Error saving speak set:", error);
    throw error;
  }
};

/**
 * Deletes a speak set by ID.
 */
export const deleteSpeakSet = async (id) => {
  try {
    await deleteDoc(doc(db, COLLECTION_NAME, id));
    
    clearSpeakCache(); // Invalidate cache on delete

    return true;
  } catch (error) {
    console.error("Error deleting speak set:", error);
    throw error;
  }
};

/**
 * Fetches a single speak set by ID.
 */
export const getSpeakById = async (id) => {
  if (cache.byId[id]) return cache.byId[id]; // Instant load if cached

  try {
    const docRef = doc(db, COLLECTION_NAME, id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const data = { ...docSnap.data(), id: docSnap.id, type: 'speak' };
      cache.byId[id] = data; // Save to cache
      return data;
    }
    return null;
  } catch (error) {
    console.error("Error getting speak set:", error);
    return null;
  }
};