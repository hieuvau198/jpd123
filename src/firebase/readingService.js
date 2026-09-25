// src/firebase/readingService.js
import { db } from './firebase-config';
import { collection, getDocs, doc, setDoc, deleteDoc, getDoc, query, where } from 'firebase/firestore';

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