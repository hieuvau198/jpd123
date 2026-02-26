import { db } from './firebase-config';
import { collection, getDocs, doc, setDoc, deleteDoc, getDoc, query, where } from 'firebase/firestore';

const COLLECTION_NAME = 'quizzes';

/**
 * Fetches all quiz sets from Firestore.
 */
export const getAllQuizzes = async () => {
  try {
    const querySnapshot = await getDocs(collection(db, COLLECTION_NAME));
    const quizzes = [];
    querySnapshot.forEach((doc) => {
      quizzes.push({ ...doc.data(), id: doc.id, type: 'quiz' });
    });
    return quizzes;
  } catch (error) {
    console.error("Error fetching quizzes:", error);
    return [];
  }
};

export const getQuizzesByTag = async (tag) => {
  try {
    const q = query(collection(db, COLLECTION_NAME), where('tags', 'array-contains', tag));
    const querySnapshot = await getDocs(q);
    const quizzes = [];
    querySnapshot.forEach((doc) => {
      quizzes.push({ ...doc.data(), id: doc.id, type: 'quiz' });
    });
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
  try {
    const docRef = doc(db, COLLECTION_NAME, id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { ...docSnap.data(), id: docSnap.id, type: 'quiz' };
    }
    return null;
  } catch (error) {
    console.error("Error getting quiz:", error);
    return null;
  }
};