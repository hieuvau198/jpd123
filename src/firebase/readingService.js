// src/firebase/readingService.js
import { db } from './firebase-config'; 
import { collection, getDocs, doc, setDoc, deleteDoc, getDoc } from 'firebase/firestore'; 
import readingTagsData from '../data/system/reading_tags.json';

const COLLECTION_NAME = 'readings'; 

const cache = {
  all: null,
  byTag: {},
  byId: {}
}; 

export const clearReadingCache = () => {
  cache.all = null;
  cache.byTag = {};
  cache.byId = {};
}; 

export const getAllReadings = async () => {
  if (cache.all) return cache.all; 
  try {
    const querySnapshot = await getDocs(collection(db, COLLECTION_NAME)); 
    const readings = []; 
    querySnapshot.forEach((d) => {
      const data = { ...d.data(), id: d.id, type: 'reading' }; 
      readings.push(data); 
      cache.byId[d.id] = data; 
    });
    cache.all = readings; 
    return readings; 
  } catch (error) {
    console.error("Error fetching readings:", error); 
    return []; 
  }
};

/**
 * Normalizes a string: trims whitespace and converts to lower case
 */
const normalizeText = (text) => (text || '').trim().toLowerCase();

/**
 * Fetches readings matching any alias configured for tagId in reading_tags.json.
 * Ignores casing differences.
 */
export const getReadingsByTag = async (tagId) => {
  if (!tagId || tagId === 'all') {
    return await getAllReadings();
  }

  if (cache.byTag[tagId]) return cache.byTag[tagId];

  try {
    const allReadings = await getAllReadings();

    // 1. Locate tag definition from reading_tags.json
    const tagConfig = readingTagsData.find(
      (t) => normalizeText(t.id) === normalizeText(tagId)
    );

    // 2. Build list of lowercased target values (tagId, name, + aliases)
    const targetValues = new Set([
      normalizeText(tagId),
      tagConfig ? normalizeText(tagConfig.name) : null,
      ...(tagConfig?.aliases || []).map(normalizeText)
    ].filter(Boolean));

    // 3. Filter items where any of the item's tags match any target value
    const matched = allReadings.filter((reading) => {
      if (!Array.isArray(reading.tags)) return false;
      return reading.tags.some((t) => targetValues.has(normalizeText(t)));
    });

    cache.byTag[tagId] = matched;
    return matched;
  } catch (error) {
    console.error(`Error fetching readings for tag ${tagId}:`, error);
    return [];
  }
};

export const getReadingById = async (id) => {
  if (cache.byId[id]) return cache.byId[id]; 
  try {
    const docRef = doc(db, COLLECTION_NAME, id); 
    const docSnap = await getDoc(docRef); 
    if (docSnap.exists()) { 
      const data = { ...docSnap.data(), id: docSnap.id, type: 'reading' }; 
      cache.byId[id] = data; 
      return data; 
    }
    return null; 
  } catch (error) {
    console.error("Error getting reading:", error); 
    return null; 
  }
};

export const saveReadingSet = async (data) => {
  try {
    if (!data.id) throw new Error("Reading data must have an 'id' field."); 
    const docRef = doc(db, COLLECTION_NAME, data.id); 
    const docSnap = await getDoc(docRef); 
    if (docSnap.exists()) { 
      return { success: false, message: 'ID already exists' }; 
    }
    const payload = { ...data, type: 'reading' }; 
    await setDoc(docRef, payload); 
    clearReadingCache(); 
    return { success: true, message: 'Saved successfully' }; 
  } catch (error) {
    console.error("Error saving reading:", error); 
    throw error; 
  }
};

export const updateReadingSet = async (id, data) => {
  try {
    const docRef = doc(db, COLLECTION_NAME, id);
    const payload = { ...data, type: 'reading' };
    await setDoc(docRef, payload);
    clearReadingCache(); 
    return { success: true, message: 'Updated successfully' };
  } catch (error) {
    console.error("Error updating reading:", error);
    throw error;
  }
};

export const deleteReadingSet = async (id) => {
  try {
    await deleteDoc(doc(db, COLLECTION_NAME, id)); 
    clearReadingCache(); 
    return true; 
  } catch (error) {
    console.error("Error deleting reading:", error); 
    throw error; 
  }
};