// src/firebase/otherQuizService.js
import { db } from './firebase-config';
import { collection, getDocs, doc, setDoc, deleteDoc, getDoc, query, where } from 'firebase/firestore';

const COLLECTION_NAME = 'other_quizzes';

// --- IN-MEMORY CACHE ---
const cache = {
  all: null,
  byTag: {},
  byId: {}
};

export const clearOtherQuizCache = () => {
  cache.all = null;
  cache.byTag = {};
  cache.byId = {};
};

export const getAllOtherQuizzes = async () => {
  if (cache.all) return cache.all;

  try {
    const querySnapshot = await getDocs(collection(db, COLLECTION_NAME));
    const quizzes = [];
    querySnapshot.forEach((doc) => {
      const data = { ...doc.data(), id: doc.id, type: 'other_quiz' };
      quizzes.push(data);
      cache.byId[doc.id] = data;
    });
    
    cache.all = quizzes;
    return quizzes;
  } catch (error) {
    console.error("Error fetching other quizzes:", error);
    return [];
  }
};

export const getOtherQuizzesByTag = async (tag) => {
  if (cache.byTag[tag]) return cache.byTag[tag];

  try {
    const q = query(collection(db, COLLECTION_NAME), where('tags', 'array-contains', tag));
    const querySnapshot = await getDocs(q);
    const quizzes = [];
    querySnapshot.forEach((doc) => {
      const data = { ...doc.data(), id: doc.id, type: 'other_quiz' };
      quizzes.push(data);
      cache.byId[doc.id] = data;
    });
    
    cache.byTag[tag] = quizzes;
    return quizzes;
  } catch (error) {
    console.error(`Error fetching other quizzes for tag ${tag}:`, error);
    return [];
  }
};

export const saveOtherQuizSet = async (data) => {
  try {
    if (!data.id) throw new Error("Quiz data must have an 'id' field.");
    
    const docRef = doc(db, COLLECTION_NAME, data.id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { success: false, message: 'ID already exists' };
    }

    const payload = { ...data, type: 'other_quiz' };
    await setDoc(docRef, payload);
    clearOtherQuizCache();

    return { success: true, message: 'Saved successfully' };
  } catch (error) {
    console.error("Error saving other quiz:", error);
    throw error;
  }
};

export const deleteOtherQuizSet = async (id) => {
  try {
    await deleteDoc(doc(db, COLLECTION_NAME, id));
    clearOtherQuizCache();
    return true;
  } catch (error) {
    console.error("Error deleting other quiz:", error);
    throw error;
  }
};

export const getOtherQuizById = async (id) => {
  if (cache.byId[id]) return cache.byId[id];

  try {
    const docRef = doc(db, COLLECTION_NAME, id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const data = { ...docSnap.data(), id: docSnap.id, type: 'other_quiz' };
      cache.byId[id] = data;
      return data;
    }
    return null;
  } catch (error) {
    console.error("Error getting other quiz:", error);
    return null;
  }
};