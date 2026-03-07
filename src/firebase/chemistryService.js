// src/firebase/chemistryService.js
import { db } from './firebase-config';
import { collection, getDocs, doc, setDoc, deleteDoc, getDoc, query, where } from 'firebase/firestore';

const COLLECTION_NAME = 'chem_quiz';

const cache = {
  all: null,
  byTag: {},
  byId: {}
};

export const clearChemistryCache = () => {
  cache.all = null;
  cache.byTag = {};
  cache.byId = {};
};

export const getAllChemistry = async () => {
  if (cache.all) return cache.all;

  try {
    const querySnapshot = await getDocs(collection(db, COLLECTION_NAME));
    const quizzes = [];
    querySnapshot.forEach((doc) => {
      const data = { ...doc.data(), id: doc.id, type: 'chemistry' };
      quizzes.push(data);
      cache.byId[doc.id] = data;
    });
    
    cache.all = quizzes;
    return quizzes;
  } catch (error) {
    console.error("Error fetching chemistry quizzes:", error);
    return [];
  }
};

export const getChemistryByTag = async (tag) => {
  if (cache.byTag[tag]) return cache.byTag[tag];

  try {
    const q = query(collection(db, COLLECTION_NAME), where('tags', 'array-contains', tag));
    const querySnapshot = await getDocs(q);
    const quizzes = [];
    querySnapshot.forEach((doc) => {
      const data = { ...doc.data(), id: doc.id, type: 'chemistry' };
      quizzes.push(data);
      cache.byId[doc.id] = data;
    });
    
    cache.byTag[tag] = quizzes;
    return quizzes;
  } catch (error) {
    console.error(`Error fetching chemistry quizzes for tag ${tag}:`, error);
    return [];
  }
};

export const saveChemistrySet = async (data) => {
  try {
    if (!data.id) throw new Error("Data must have an 'id' field.");
    const docRef = doc(db, COLLECTION_NAME, data.id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) return { success: false, message: 'ID already exists' };

    const payload = { ...data, type: 'chemistry' };
    await setDoc(docRef, payload);
    clearChemistryCache();
    return { success: true, message: 'Saved successfully' };
  } catch (error) {
    console.error("Error saving chemistry quiz:", error);
    throw error;
  }
};

export const deleteChemistrySet = async (id) => {
  try {
    await deleteDoc(doc(db, COLLECTION_NAME, id));
    clearChemistryCache();
    return true;
  } catch (error) {
    console.error("Error deleting chemistry quiz:", error);
    throw error;
  }
};

export const getChemistryById = async (id) => {
  if (cache.byId[id]) return cache.byId[id];
  try {
    const docRef = doc(db, COLLECTION_NAME, id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const data = { ...docSnap.data(), id: docSnap.id, type: 'chemistry' };
      cache.byId[id] = data;
      return data;
    }
    return null;
  } catch (error) {
    console.error("Error getting chemistry quiz:", error);
    return null;
  }
};