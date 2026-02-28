// src/firebase/phoneticService.js
import { db } from './firebase-config';
import { collection, getDocs, doc, setDoc, deleteDoc, getDoc, query, where } from 'firebase/firestore';

const COLLECTION_NAME = 'phonetics';

export const getAllPhonetics = async () => {
  try {
    const querySnapshot = await getDocs(collection(db, COLLECTION_NAME));
    const phonetics = [];
    querySnapshot.forEach((doc) => {
      phonetics.push({ ...doc.data(), id: doc.id, type: 'phonetic' });
    });
    return phonetics;
  } catch (error) {
    console.error("Error fetching phonetics:", error);
    return [];
  }
};

export const getPhoneticsByTag = async (tag) => {
  try {
    const q = query(collection(db, COLLECTION_NAME), where('tags', 'array-contains', tag));
    const querySnapshot = await getDocs(q);
    const phonetics = [];
    querySnapshot.forEach((doc) => {
      phonetics.push({ ...doc.data(), id: doc.id, type: 'phonetic' });
    });
    return phonetics;
  } catch (error) {
    console.error(`Error fetching phonetics for tag ${tag}:`, error);
    return [];
  }
};

export const getPhoneticById = async (id) => {
  try {
    const docRef = doc(db, 'phonetics', id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { ...docSnap.data(), id: docSnap.id, type: 'phonetic' };
    }
    return null;
  } catch (error) {
    console.error("Error getting phonetic set:", error);
    return null;
  }
};

export const savePhoneticSet = async (data) => {
  try {
    if (!data.id) throw new Error("Phonetic data must have an 'id' field.");
    const docRef = doc(db, COLLECTION_NAME, data.id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { success: false, message: 'ID already exists' };
    }
    const payload = { ...data, type: data.type || 'phonetic' };
    await setDoc(docRef, payload);
    return { success: true, message: 'Saved successfully' };
  } catch (error) {
    console.error("Error saving phonetic set:", error);
    throw error;
  }
};

export const updatePhoneticSet = async (id, data) => {
  try {
    const docRef = doc(db, COLLECTION_NAME, id);
    // Use setDoc to overwrite completely while retaining the ID
    await setDoc(docRef, { ...data, type: data.type || 'phonetic' });
    return { success: true, message: 'Updated successfully' };
  } catch (error) {
    console.error("Error updating phonetic set:", error);
    throw error;
  }
};

export const deletePhoneticSet = async (id) => {
  try {
    await deleteDoc(doc(db, COLLECTION_NAME, id));
    return true;
  } catch (error) {
    console.error("Error deleting phonetic set:", error);
    throw error;
  }
};