import { db } from './firebase-config';
import { collection, getDocs, doc, setDoc, deleteDoc } from 'firebase/firestore';

const COLLECTION_NAME = 'flashcards';

/**
 * Fetches all flashcard sets from Firestore.
 */
export const getAllFlashcards = async () => {
  try {
    const querySnapshot = await getDocs(collection(db, COLLECTION_NAME));
    const flashcards = [];
    querySnapshot.forEach((doc) => {
      // We ensure the type is strictly set to 'flashcard'
      flashcards.push({ ...doc.data(), id: doc.id, type: 'flashcard' });
    });
    return flashcards;
  } catch (error) {
    console.error("Error fetching flashcards:", error);
    return [];
  }
};

/**
 * Saves or Updates a flashcard set. 
 * Uses the 'id' field from the JSON as the document ID to prevent duplicates.
 */
export const saveFlashcardSet = async (data) => {
  try {
    if (!data.id) throw new Error("Flashcard data must have an 'id' field.");
    
    const docRef = doc(db, COLLECTION_NAME, data.id);
    // Ensure the data saved has the type 'flashcard'
    const payload = { ...data, type: 'flashcard' };
    
    await setDoc(docRef, payload);
    return true;
  } catch (error) {
    console.error("Error saving flashcard:", error);
    throw error;
  }
};

/**
 * Deletes a flashcard set by ID.
 */
export const deleteFlashcardSet = async (id) => {
  try {
    await deleteDoc(doc(db, COLLECTION_NAME, id));
    return true;
  } catch (error) {
    console.error("Error deleting flashcard:", error);
    throw error;
  }
};