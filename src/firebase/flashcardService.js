// src/firebase/flashcardService.js
import { db } from './firebase-config';
import { collection, getDocs, doc, setDoc, deleteDoc, getDoc, query, where } from 'firebase/firestore';

const COLLECTION_NAME = 'flashcards';

export const getAllFlashcards = async () => {
  try {
    const querySnapshot = await getDocs(collection(db, COLLECTION_NAME));
    const flashcards = [];
    querySnapshot.forEach((doc) => {
      flashcards.push({ ...doc.data(), id: doc.id, type: 'flashcard' });
    });
    return flashcards;
  } catch (error) {
    console.error("Error fetching flashcards:", error);
    return [];
  }
};

// --- NEW FUNCTION TO SAVE QUOTA ---
export const getFlashcardsByTag = async (tag) => {
  try {
    const q = query(collection(db, COLLECTION_NAME), where('tags', 'array-contains', tag));
    const querySnapshot = await getDocs(q);
    const flashcards = [];
    querySnapshot.forEach((doc) => {
      flashcards.push({ ...doc.data(), id: doc.id, type: 'flashcard' });
    });
    return flashcards;
  } catch (error) {
    console.error(`Error fetching flashcards for tag ${tag}:`, error);
    return [];
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
    return { success: true, message: 'Saved successfully' };
  } catch (error) {
    console.error("Error saving flashcard:", error);
    throw error;
  }
};

export const deleteFlashcardSet = async (id) => {
  try {
    await deleteDoc(doc(db, COLLECTION_NAME, id));
    return true;
  } catch (error) {
    console.error("Error deleting flashcard:", error);
    throw error;
  }
};

export const getFlashcardById = async (id) => {
  try {
    const docRef = doc(db, COLLECTION_NAME, id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { ...docSnap.data(), id: docSnap.id, type: 'flashcard' };
    }
    return null;
  } catch (error) {
    console.error("Error getting flashcard:", error);
    return null;
  }
};