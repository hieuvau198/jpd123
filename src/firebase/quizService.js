import { db } from './firebase-config';
import { collection, getDocs, doc, setDoc, deleteDoc, getDoc, query, where } from 'firebase/firestore';

const COLLECTION_NAME = 'quizzes';

// --- IN-MEMORY CACHE ---
// This stores fetched data temporarily while the app is open
const cache = {
  all: null,
  byTag: {},
  byId: {}
};

// Helper function to clear cache when data is modified (saved/deleted)
export const clearQuizCache = () => {
  cache.all = null;
  cache.byTag = {};
  cache.byId = {};
};

/**
 * Fetches all quiz sets from Firestore.
 */
export const getAllQuizzes = async () => {
  if (cache.all) return cache.all; // Return cached data if available

  try {
    const querySnapshot = await getDocs(collection(db, COLLECTION_NAME));
    const quizzes = [];
    querySnapshot.forEach((doc) => {
      const data = { ...doc.data(), id: doc.id, type: 'quiz' };
      quizzes.push(data);
      cache.byId[doc.id] = data; // Also cache individual items for quick lookup
    });
    
    cache.all = quizzes; // Save to cache
    return quizzes;
  } catch (error) {
    console.error("Error fetching quizzes:", error);
    return [];
  }
};

export const getQuizzesByTag = async (tag) => {
  if (cache.byTag[tag]) return cache.byTag[tag]; // Return cached list for this tag if available

  try {
    const q = query(collection(db, COLLECTION_NAME), where('tags', 'array-contains', tag));
    const querySnapshot = await getDocs(q);
    const quizzes = [];
    querySnapshot.forEach((doc) => {
      const data = { ...doc.data(), id: doc.id, type: 'quiz' };
      quizzes.push(data);
      cache.byId[doc.id] = data; // Also cache individual items so Detail page loads instantly
    });
    
    cache.byTag[tag] = quizzes; // Save to cache
    return quizzes;
  } catch (error) {
    console.error(`Error fetching quizzes for tag ${tag}:`, error);
    return [];
  }
};

/**
 * Saves a quiz set.
 */
export const saveQuizSet = async (data) => {
  try {
    if (!data.id) throw new Error("Quiz data must have an 'id' field.");
    
    const docRef = doc(db, COLLECTION_NAME, data.id);
    
    // Check if it exists
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { success: false, message: 'ID already exists' };
    }

    // Ensure the data saved has the type 'quiz'
    const payload = { ...data, type: 'quiz' };
    
    await setDoc(docRef, payload);
    
    // Data changed, invalidate the cache so fresh data is fetched next time
    clearQuizCache();

    return { success: true, message: 'Saved successfully' };
  } catch (error) {
    console.error("Error saving quiz:", error);
    throw error;
  }
};

/**
 * Deletes a quiz set by ID.
 */
export const deleteQuizSet = async (id) => {
  try {
    await deleteDoc(doc(db, COLLECTION_NAME, id));
    
    // Data changed, invalidate the cache
    clearQuizCache();

    return true;
  } catch (error) {
    console.error("Error deleting quiz:", error);
    throw error;
  }
};

/**
 * Fetches a single quiz by ID.
 */
export const getQuizById = async (id) => {
  if (cache.byId[id]) return cache.byId[id]; // Instant load if we fetched this from the list view

  try {
    const docRef = doc(db, COLLECTION_NAME, id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const data = { ...docSnap.data(), id: docSnap.id, type: 'quiz' };
      cache.byId[id] = data; // Save to cache
      return data;
    }
    return null;
  } catch (error) {
    console.error("Error getting quiz:", error);
    return null;
  }
};