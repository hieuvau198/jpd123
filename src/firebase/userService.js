// src/firebase/userService.js
import { db } from './firebase-config';
import { collection, getDocs, doc, addDoc, updateDoc, deleteDoc, serverTimestamp, query, where } from 'firebase/firestore';

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
    const docRef = await addDoc(collection(db, COLLECTION_NAME), payload);
    return { success: true, id: docRef.id };
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
    const q = query(
      collection(db, COLLECTION_NAME), 
      where("username", "==", username),
      where("password", "==", password),
      where("role", "==", role)
    );
    const querySnapshot = await getDocs(q);
    
    if (!querySnapshot.empty) {
      const userDoc = querySnapshot.docs[0];
      return { success: true, user: { id: userDoc.id, ...userDoc.data() } };
    } else {
      return { success: false, message: "Invalid credentials or role" };
    }
  } catch (error) {
    console.error("Login error:", error);
    throw error;
  }
};