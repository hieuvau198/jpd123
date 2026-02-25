import { db } from './firebase-config';
import { collection, getDocs, doc, setDoc, deleteDoc, getDoc } from 'firebase/firestore';

const COLLECTION_NAME = 'defenses';

export const getAllDefenses = async () => {
  try {
    const querySnapshot = await getDocs(collection(db, COLLECTION_NAME));
    const defenses = [];
    querySnapshot.forEach((doc) => {
      defenses.push({ ...doc.data(), id: doc.id, itemType: 'defense' });
    });
    return defenses;
  } catch (error) {
    console.error("Error fetching defenses:", error);
    return [];
  }
};

export const saveDefenseSet = async (data) => {
  try {
    if (!data.id) throw new Error("Defense data must have an 'id' field.");
    
    const docRef = doc(db, COLLECTION_NAME, data.id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { success: false, message: 'ID already exists' };
    }

    const payload = { ...data, itemType: 'defense' };
    await setDoc(docRef, payload);
    return { success: true, message: 'Saved successfully' };
  } catch (error) {
    console.error("Error saving defense:", error);
    throw error;
  }
};

export const deleteDefenseSet = async (id) => {
  try {
    await deleteDoc(doc(db, COLLECTION_NAME, id));
    return true;
  } catch (error) {
    console.error("Error deleting defense:", error);
    throw error;
  }
};

export const getDefenseById = async (id) => {
  try {
    const docRef = doc(db, COLLECTION_NAME, id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { ...docSnap.data(), id: docSnap.id, itemType: 'defense' };
    }
    return null;
  } catch (error) {
    console.error("Error getting defense:", error);
    return null;
  }
};

export const updateDefenseSet = async (id, data) => {
  try {
    const docRef = doc(db, COLLECTION_NAME, id);
    // Overwrite the document with the new payload
    const payload = { ...data, itemType: 'defense' };
    await setDoc(docRef, payload); 
    return { success: true, message: 'Updated successfully' };
  } catch (error) {
    console.error("Error updating defense:", error);
    throw error;
  }
};