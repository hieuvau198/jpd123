// src/firebase/userService.js
import { db } from './firebase-config';
import { 
  collection, getDocs, doc, addDoc, updateDoc, deleteDoc, 
  serverTimestamp, query, where, orderBy, limit, setDoc, 
  writeBatch, arrayUnion, arrayRemove 
} from 'firebase/firestore'; 
import titlesData from '../data/system/titles.json';

const COLLECTION_NAME = 'users';
const GROUPS_COLLECTION = 'groups'; // New groups collection

// --- NEW: Get all groups ---
export const getAllGroups = async () => {
  try {
    const querySnapshot = await getDocs(collection(db, GROUPS_COLLECTION));
    return querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error("Error fetching groups:", error);
    return [];
  }
};

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
    // Extract groupIds from form data
    const { groupIds, ...userFields } = userData;
    const defaultTitleInfo = titlesData[0];

    const payload = {
      ...userFields,
      level: defaultTitleInfo.minLevel,
      title: defaultTitleInfo.title,
      personal_coins: 0,
      createdAt: serverTimestamp(), 
    };
    
    const batch = writeBatch(db);
    let userId;

    if (userFields.username) {
      userId = userFields.username.trim();
      const docRef = doc(db, COLLECTION_NAME, userId);
      batch.set(docRef, payload);
    } else {
      const docRef = doc(collection(db, COLLECTION_NAME));
      userId = docRef.id;
      batch.set(docRef, payload);
    }

    // Add user to selected groups
    if (groupIds && groupIds.length > 0) {
      groupIds.forEach(groupId => {
        const groupRef = doc(db, GROUPS_COLLECTION, groupId);
        batch.update(groupRef, {
          studentIds: arrayUnion(userId)
        });
      });
    }

    await batch.commit();
    return { success: true, id: userId };
  } catch (error) {
    console.error("Error creating user:", error);
    throw error;
  }
};

export const updateUser = async (id, userData) => {
  try {
    const { groupIds, ...userFields } = userData;
    const batch = writeBatch(db);
    const userRef = doc(db, COLLECTION_NAME, id);
    
    // 1. Update User Data
    batch.update(userRef, userFields);

    // 2. Manage Group Assignments
    if (groupIds !== undefined) {
      // Find current groups user is a part of
      const q = query(collection(db, GROUPS_COLLECTION), where("studentIds", "array-contains", id));
      const currentGroupsSnap = await getDocs(q);
      const currentGroupIds = currentGroupsSnap.docs.map(d => d.id);

      const newGroupIds = groupIds || [];

      // Groups to remove user from
      const groupsToRemove = currentGroupIds.filter(gId => !newGroupIds.includes(gId));
      // Groups to add user to
      const groupsToAdd = newGroupIds.filter(gId => !currentGroupIds.includes(gId));

      groupsToRemove.forEach(groupId => {
        batch.update(doc(db, GROUPS_COLLECTION, groupId), {
          studentIds: arrayRemove(id)
        });
      });

      groupsToAdd.forEach(groupId => {
        batch.update(doc(db, GROUPS_COLLECTION, groupId), {
          studentIds: arrayUnion(id)
        });
      });
    }

    await batch.commit();
    return { success: true };
  } catch (error) {
    console.error("Error updating user:", error);
    throw error;
  }
};

export const deleteUser = async (id) => {
  try {
    const batch = writeBatch(db);
    const userRef = doc(db, COLLECTION_NAME, id);
    
    // 1. Remove user from all groups they belong to
    const q = query(collection(db, GROUPS_COLLECTION), where("studentIds", "array-contains", id));
    const currentGroupsSnap = await getDocs(q);
    
    currentGroupsSnap.forEach(groupDoc => {
      batch.update(groupDoc.ref, {
        studentIds: arrayRemove(id)
      });
    });

    // 2. Delete the user doc
    batch.delete(userRef);

    await batch.commit();
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