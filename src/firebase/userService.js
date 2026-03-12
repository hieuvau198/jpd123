// src/firebase/userService.js
import { db } from './firebase-config';
import { collection, getDocs, doc, addDoc, updateDoc, deleteDoc, serverTimestamp, query, where, orderBy, limit } from 'firebase/firestore'; // Added orderBy and limit

const COLLECTION_NAME = 'users';

export const getAllUsers = async () => {
  try {
    const querySnapshot = await getDocs(collection(db, COLLECTION_NAME));
    const users = [];
    querySnapshot.forEach((doc) => {
      users.push({ id: doc.id, ...doc.data() });
    });
    return users;
  } catch (error) {
    console.error("Error fetching users:", error);
    return [];
  }
};

export const createUser = async (userData) => {
  try {
    const payload = {
      ...userData,
      createdAt: serverTimestamp(), // Firebase server time
    };
    
    // Check if username exists to use as ID
    if (userData.username) {
      const docId = userData.username.trim();
      const docRef = doc(db, COLLECTION_NAME, docId);
      // setDoc replaces addDoc to specify our own ID
      await setDoc(docRef, payload);
      return { success: true, id: docId };
    } else {
      // Fallback just in case username is somehow missing
      const docRef = await addDoc(collection(db, COLLECTION_NAME), payload);
      return { success: true, id: docRef.id };
    }
  } catch (error) {
    console.error("Error creating user:", error);
    throw error;
  }
};

export const updateUser = async (id, userData) => {
  try {
    const docRef = doc(db, COLLECTION_NAME, id);
    await updateDoc(docRef, userData);
    return { success: true };
  } catch (error) {
    console.error("Error updating user:", error);
    throw error;
  }
};

export const deleteUser = async (id) => {
  try {
    await deleteDoc(doc(db, COLLECTION_NAME, id));
    return { success: true };
  } catch (error) {
    console.error("Error deleting user:", error);
    throw error;
  }
};

export const loginUser = async (username, password, role) => {
  try {
    // 1. Query only by role to get the subset of users (avoids case-sensitive constraints)
    const q = query(
      collection(db, COLLECTION_NAME), 
      where("role", "==", role)
    );
    const querySnapshot = await getDocs(q);
    
    // 2. Convert the input username to lowercase
    const lowerInputUsername = username.toLowerCase().trim();

    // 3. Find the matching user in JavaScript (case-insensitive username, exact password)
    const userDoc = querySnapshot.docs.find((doc) => {
      const data = doc.data();
      return (
        data.username?.toLowerCase() === lowerInputUsername && 
        data.password === password
      );
    });
    
    if (userDoc) {
      return { success: true, user: { id: userDoc.id, ...userDoc.data() } };
    } else {
      return { success: false, message: "Invalid credentials or role" };
    }
  } catch (error) {
    console.error("Login error:", error);
    throw error;
  }
};

export const getTopUsersByCoins = async (limitCount = 5) => {
  try {
    const q = query(
      collection(db, COLLECTION_NAME),
      // Assuming you might want to filter by role='student', uncomment the next line if so
      // where("role", "==", "student"),
      orderBy("personal_coins", "desc"),
      limit(limitCount)
    );
    const querySnapshot = await getDocs(q);
    const topUsers = [];
    querySnapshot.forEach((doc) => {
      topUsers.push({ id: doc.id, ...doc.data() });
    });
    return topUsers;
  } catch (error) {
    console.error("Error fetching top users:", error);
    return [];
  }
};