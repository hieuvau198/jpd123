import { db } from './firebase-config';
import { collection, getDocs, doc, setDoc, deleteDoc, getDoc } from 'firebase/firestore';

const COLLECTION_NAME = 'speaks';

/**
 * Fetches all speak sets from Firestore.
 */
export const getAllSpeaks = async () => {
  try {
    const querySnapshot = await getDocs(collection(db, COLLECTION_NAME));
    const speaks = [];
    querySnapshot.forEach((doc) => {
      speaks.push({ ...doc.data(), id: doc.id, type: 'speak' });
    });
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
  try {
    const docRef = doc(db, COLLECTION_NAME, id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { ...docSnap.data(), id: docSnap.id, type: 'speak' };
    }
    return null;
  } catch (error) {
    console.error("Error getting speak set:", error);
    return null;
  }
};