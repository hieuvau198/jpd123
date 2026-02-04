import { db } from './firebase-config';
import { collection, getDocs, doc, setDoc, deleteDoc, getDoc } from 'firebase/firestore';

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
 * Saves a flashcard set.
 * Checks if the ID already exists. If so, it SKIPS the save (does not overwrite).
 * Returns { success: boolean, message: string }
 */
export const saveFlashcardSet = async (data) => {
  try {
    if (!data.id) throw new Error("Flashcard data must have an 'id' field.");
    
    const docRef = doc(db, COLLECTION_NAME, data.id);
    
    // Check if it exists
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { success: false, message: 'ID already exists' };
    }

    // Ensure the data saved has the type 'flashcard'
    const payload = { ...data, type: 'flashcard' };
    
    await setDoc(docRef, payload);
    return { success: true, message: 'Saved successfully' };
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