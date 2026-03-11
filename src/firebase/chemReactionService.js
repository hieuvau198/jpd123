// src/firebase/chemReactionService.js
import { db } from './firebase-config';
import { collection, getDocs, doc, setDoc, deleteDoc, getDoc, query, where } from 'firebase/firestore';

const COLLECTION_NAME = 'chem_reaction';

const cache = {
  all: null,
  byTag: {},
  byId: {}
};

export const clearChemReactionCache = () => {
  cache.all = null;
  cache.byTag = {};
  cache.byId = {};
};

export const getAllChemReactions = async () => {
  if (cache.all) return cache.all;

  try {
    const querySnapshot = await getDocs(collection(db, COLLECTION_NAME));
    const reactions = [];
    querySnapshot.forEach((doc) => {
      const data = { ...doc.data(), id: doc.id, type: 'chemReaction' };
      reactions.push(data);
      cache.byId[doc.id] = data;
    });
    
    cache.all = reactions;
    return reactions;
  } catch (error) {
    console.error("Error fetching chem reactions:", error);
    return [];
  }
};

export const getChemReactionsByTag = async (tag) => {
  if (!tag || tag === 'all') {
    return await getAllChemReactions();
  }

  if (cache.byTag[tag]) return cache.byTag[tag];

  try {
    const q = query(collection(db, COLLECTION_NAME), where('tags', 'array-contains', tag));
    const querySnapshot = await getDocs(q);
    const reactions = [];
    querySnapshot.forEach((doc) => {
      const data = { ...doc.data(), id: doc.id, type: 'chemReaction' };
      reactions.push(data);
      cache.byId[doc.id] = data;
    });
    
    cache.byTag[tag] = reactions;
    return reactions;
  } catch (error) {
    console.error(`Error fetching chem reactions for tag ${tag}:`, error);
    return [];
  }
};

export const saveChemReactionSet = async (data) => {
  try {
    if (!data.id) throw new Error("Data must have an 'id' field.");
    const docRef = doc(db, COLLECTION_NAME, data.id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) return { success: false, message: 'ID already exists' };

    const payload = { ...data, type: 'chemReaction' };
    await setDoc(docRef, payload);
    clearChemReactionCache();
    return { success: true, message: 'Saved successfully' };
  } catch (error) {
    console.error("Error saving chem reaction:", error);
    throw error;
  }
};

export const deleteChemReactionSet = async (id) => {
  try {
    await deleteDoc(doc(db, COLLECTION_NAME, id));
    clearChemReactionCache();
    return true;
  } catch (error) {
    console.error("Error deleting chem reaction:", error);
    throw error;
  }
};

export const getChemReactionById = async (id) => {
  if (cache.byId[id]) return cache.byId[id];
  try {
    const docRef = doc(db, COLLECTION_NAME, id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const data = { ...docSnap.data(), id: docSnap.id, type: 'chemReaction' };
      cache.byId[id] = data;
      return data;
    }
    return null;
  } catch (error) {
    console.error("Error getting chem reaction:", error);
    return null;
  }
};