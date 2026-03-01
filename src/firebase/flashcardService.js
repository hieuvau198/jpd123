// src/firebase/flashcardService.js
import { db } from './firebase-config';
import { collection, getDocs, doc, setDoc, deleteDoc, getDoc, query, where } from 'firebase/firestore';

const COLLECTION_NAME = 'flashcards';

// --- IN-MEMORY CACHE ---
// This stores fetched data temporarily while the app is open
const cache = {
  all: null,
  byTag: {},
  byId: {}
};

// Helper function to clear cache when data is modified (saved/deleted)
export const clearFlashcardCache = () => {
  cache.all = null;
  cache.byTag = {};
  cache.byId = {};
};

export const getAllFlashcards = async () => {
  if (cache.all) return cache.all; // Return cached data if available

  try {
    const querySnapshot = await getDocs(collection(db, COLLECTION_NAME));
    const flashcards = [];
    querySnapshot.forEach((doc) => {
      const data = { ...doc.data(), id: doc.id, type: 'flashcard' };
      flashcards.push(data);
      cache.byId[doc.id] = data; // Also cache individual items for quick lookup
    });
    
    cache.all = flashcards; // Save to cache
    return flashcards;
  } catch (error) {
    console.error("Error fetching flashcards:", error);
    return [];
  }
};

export const getFlashcardsByTag = async (tag) => {
  if (cache.byTag[tag]) return cache.byTag[tag]; // Return cached list for this tag if available

  try {
    const q = query(collection(db, COLLECTION_NAME), where('tags', 'array-contains', tag));
    const querySnapshot = await getDocs(q);
    const flashcards = [];
    querySnapshot.forEach((doc) => {
      const data = { ...doc.data(), id: doc.id, type: 'flashcard' };
      flashcards.push(data);
      cache.byId[doc.id] = data; // Also cache individual items so Detail page loads instantly
    });
    
    cache.byTag[tag] = flashcards; // Save to cache
    return flashcards;
  } catch (error) {
    console.error(`Error fetching flashcards for tag ${tag}:`, error);
    return [];
  }
};

export const getFlashcardById = async (id) => {
  if (cache.byId[id]) return cache.byId[id]; // Instant load if we fetched this from the list view

  try {
    const docRef = doc(db, COLLECTION_NAME, id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const data = { ...docSnap.data(), id: docSnap.id, type: 'flashcard' };
      cache.byId[id] = data; // Save to cache
      return data;
    }
    return null;
  } catch (error) {
    console.error("Error getting flashcard:", error);
    return null;
  }
};

export const saveFlashcardSet = async (data) => {
  try {
    if (!data.id) throw new Error("Flashcard data must have an 'id' field.");
    const docRef = doc(db, COLLECTION_NAME, data.id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { success: false, message: 'ID already exists' };
    }
    const payload = { ...data, type: 'flashcard' };
    await setDoc(docRef, payload);
    
    // Data changed, invalidate the cache so fresh data is fetched next time
    clearFlashcardCache(); 
    
    return { success: true, message: 'Saved successfully' };
  } catch (error) {
    console.error("Error saving flashcard:", error);
    throw error;
  }
};

export const deleteFlashcardSet = async (id) => {
  try {
    await deleteDoc(doc(db, COLLECTION_NAME, id));
    
    // Data changed, invalidate the cache
    clearFlashcardCache();
    
    return true;
  } catch (error) {
    console.error("Error deleting flashcard:", error);
    throw error;
  }
};