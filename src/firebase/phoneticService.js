// src/firebase/phoneticService.js
import { db } from './firebase-config';
import { collection, getDocs, doc, setDoc, deleteDoc, getDoc, query, where } from 'firebase/firestore';

const COLLECTION_NAME = 'phonetics';

// --- IN-MEMORY CACHE ---
const cache = {
  all: null,
  byTag: {},
  byId: {}
};

export const clearPhoneticCache = () => {
  cache.all = null;
  cache.byTag = {};
  cache.byId = {};
};

export const getAllPhonetics = async () => {
  if (cache.all) return cache.all; // Return cached data if available

  try {
    const querySnapshot = await getDocs(collection(db, COLLECTION_NAME));
    const phonetics = [];
    querySnapshot.forEach((doc) => {
      const data = { ...doc.data(), id: doc.id, type: 'phonetic' };
      phonetics.push(data);
      cache.byId[doc.id] = data; // Cache individual items
    });
    
    cache.all = phonetics; // Save to cache
    return phonetics;
  } catch (error) {
    console.error("Error fetching phonetics:", error);
    return [];
  }
};

export const getPhoneticsByTag = async (tag) => {
  if (cache.byTag[tag]) return cache.byTag[tag]; // Return cached list for this tag

  try {
    const q = query(collection(db, COLLECTION_NAME), where('tags', 'array-contains', tag));
    const querySnapshot = await getDocs(q);
    const phonetics = [];
    querySnapshot.forEach((doc) => {
      const data = { ...doc.data(), id: doc.id, type: 'phonetic' };
      phonetics.push(data);
      cache.byId[doc.id] = data; 
    });
    
    cache.byTag[tag] = phonetics; // Save to cache
    return phonetics;
  } catch (error) {
    console.error(`Error fetching phonetics for tag ${tag}:`, error);
    return [];
  }
};

export const getPhoneticById = async (id) => {
  if (cache.byId[id]) return cache.byId[id]; // Instant load if cached

  try {
    const docRef = doc(db, COLLECTION_NAME, id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const data = { ...docSnap.data(), id: docSnap.id, type: 'phonetic' };
      cache.byId[id] = data; // Save to cache
      return data;
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
    
    clearPhoneticCache(); // Invalidate cache on write
    
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
    
    clearPhoneticCache(); // Invalidate cache on write
    
    return { success: true, message: 'Updated successfully' };
  } catch (error) {
    console.error("Error updating phonetic set:", error);
    throw error;
  }
};

export const deletePhoneticSet = async (id) => {
  try {
    await deleteDoc(doc(db, COLLECTION_NAME, id));
    
    clearPhoneticCache(); // Invalidate cache on delete
    
    return true;
  } catch (error) {
    console.error("Error deleting phonetic set:", error);
    throw error;
  }
};