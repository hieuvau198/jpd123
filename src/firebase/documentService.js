// src/firebase/documentService.js
import { db } from './firebase-config';
import { collection, getDocs, doc, setDoc, deleteDoc, getDoc, query, where } from 'firebase/firestore';

const COLLECTION_NAME = 'documents';

const cache = {
  all: null,
  byTag: {},
  byId: {}
};

export const clearDocumentCache = () => {
  cache.all = null;
  cache.byTag = {};
  cache.byId = {};
};

export const getAllDocuments = async () => {
  if (cache.all) return cache.all;

  try {
    const querySnapshot = await getDocs(collection(db, COLLECTION_NAME));
    const documents = [];
    querySnapshot.forEach((doc) => {
      const data = { ...doc.data(), id: doc.id, type: 'document' };
      documents.push(data);
      cache.byId[doc.id] = data;
    });
    
    cache.all = documents;
    return documents;
  } catch (error) {
    console.error("Error fetching documents:", error);
    return [];
  }
};

export const getDocumentsByTag = async (tag) => {
  if (cache.byTag[tag]) return cache.byTag[tag];

  try {
    const q = query(collection(db, COLLECTION_NAME), where('tags', 'array-contains', tag));
    const querySnapshot = await getDocs(q);
    const documents = [];
    querySnapshot.forEach((doc) => {
      const data = { ...doc.data(), id: doc.id, type: 'document' };
      documents.push(data);
      cache.byId[doc.id] = data;
    });
    
    cache.byTag[tag] = documents;
    return documents;
  } catch (error) {
    console.error(`Error fetching documents for tag ${tag}:`, error);
    return [];
  }
};

export const saveDocumentSet = async (data) => {
  try {
    if (!data.id) throw new Error("Document data must have an 'id' field.");
    const docRef = doc(db, COLLECTION_NAME, data.id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { success: false, message: 'ID already exists' };
    }
    const payload = { ...data, type: 'document' };
    await setDoc(docRef, payload);
    
    clearDocumentCache(); 
    return { success: true, message: 'Saved successfully' };
  } catch (error) {
    console.error("Error saving document:", error);
    throw error;
  }
};

export const deleteDocumentSet = async (id) => {
  try {
    await deleteDoc(doc(db, COLLECTION_NAME, id));
    clearDocumentCache();
    return true;
  } catch (error) {
    console.error("Error deleting document:", error);
    throw error;
  }
};

// Add this below your other functions in src/firebase/documentService.js
export const getDocumentById = async (id) => {
  if (cache.byId[id]) return cache.byId[id]; // Instant load if we fetched this from the list view

  try {
    const docRef = doc(db, COLLECTION_NAME, id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const data = { ...docSnap.data(), id: docSnap.id, type: 'document' };
      cache.byId[id] = data; // Save to cache
      return data;
    }
    return null;
  } catch (error) {
    console.error("Error getting document:", error);
    return null;
  }
};