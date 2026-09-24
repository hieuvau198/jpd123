// src/firebase/slotService.js
import { db } from './firebase-config';
import {
  collection,
  getDocs,
  doc,
  setDoc,
  deleteDoc,
  getDoc,
  query,
  where,
  addDoc,
  updateDoc,
  writeBatch,
  serverTimestamp
} from 'firebase/firestore';

const DEFAULT_SLOTS_COLLECTION = 'default_slots';
const SLOTS_COLLECTION = 'slots';

// In-memory cache
const cache = {
  defaultSlots: null,
  slotsByStudent: {},
  allSlots: null,
};

export const clearSlotCache = () => {
  cache.defaultSlots = null;
  cache.slotsByStudent = {};
  cache.allSlots = null;
};

/* =========================================================================
   1. DEFAULT SLOTS (Khung giờ mặc định: dayOfWeek, startTime, endTime)
   ========================================================================= */

export const getAllDefaultSlots = async (forceRefresh = false) => {
  if (!forceRefresh && cache.defaultSlots) return cache.defaultSlots;
  try {
    const snapshot = await getDocs(collection(db, DEFAULT_SLOTS_COLLECTION));
    const items = [];
    snapshot.forEach((d) => {
      items.push({ id: d.id, ...d.data() });
    });
    // Sắp xếp theo thứ trong tuần và giờ bắt đầu
    items.sort((a, b) => {
      if (a.dayOfWeek !== b.dayOfWeek) return (a.dayOfWeek || 0) - (b.dayOfWeek || 0);
      return (a.startTime || '').localeCompare(b.startTime || '');
    });
    cache.defaultSlots = items;
    return items;
  } catch (error) {
    console.error('Lỗi khi lấy default_slots:', error);
    return [];
  }
};

export const saveDefaultSlot = async (data) => {
  try {
    const payload = {
      dayOfWeek: Number(data.dayOfWeek), // 2 = Thứ 2, 3 = Thứ 3, ..., 8 = Chủ Nhật
      startTime: data.startTime,         // e.g. "17:30"
      endTime: data.endTime,             // e.g. "19:00"
      title: data.title || '',
      updatedAt: serverTimestamp(),
    };

    if (data.id) {
      await updateDoc(doc(db, DEFAULT_SLOTS_COLLECTION, data.id), payload);
    } else {
      payload.createdAt = serverTimestamp();
      await addDoc(collection(db, DEFAULT_SLOTS_COLLECTION), payload);
    }
    clearSlotCache();
    return { success: true };
  } catch (error) {
    console.error('Lỗi khi lưu default_slot:', error);
    throw error;
  }
};

export const deleteDefaultSlot = async (id) => {
  try {
    await deleteDoc(doc(db, DEFAULT_SLOTS_COLLECTION, id));
    clearSlotCache();
    return true;
  } catch (error) {
    console.error('Lỗi khi xóa default_slot:', error);
    throw error;
  }
};

/* =========================================================================
   2. SLOTS (Lịch học của học sinh: defaultSlotId, studentId, studentName, date, status)
   ========================================================================= */

export const getSlotsByStudentId = async (studentId, forceRefresh = false) => {
  if (!forceRefresh && cache.slotsByStudent[studentId]) {
    return cache.slotsByStudent[studentId];
  }
  try {
    const q = query(
      collection(db, SLOTS_COLLECTION),
      where('studentId', '==', studentId)
    );
    const snapshot = await getDocs(q);
    const items = [];
    snapshot.forEach((d) => {
      items.push({ id: d.id, ...d.data() });
    });
    // Sắp xếp ngày học tăng dần
    items.sort((a, b) => (a.date || '').localeCompare(b.date || ''));
    cache.slotsByStudent[studentId] = items;
    return items;
  } catch (error) {
    console.error(`Lỗi khi lấy slots của học sinh ${studentId}:`, error);
    return [];
  }
};

export const saveStudentSlot = async (data) => {
  try {
    const payload = {
      defaultSlotId: data.defaultSlotId || '',
      studentId: data.studentId,
      studentName: data.studentName || '',
      date: data.date,                                     // Định dạng YYYY-MM-DD
      status: data.status || 'pending',                    // 'present' (có mặt) | 'absent' (vắng) | 'pending' (chưa diễn ra)
      note: data.note || '',
      updatedAt: serverTimestamp(),
    };

    if (data.id) {
      await updateDoc(doc(db, SLOTS_COLLECTION, data.id), payload);
    } else {
      payload.createdAt = serverTimestamp();
      await addDoc(collection(db, SLOTS_COLLECTION), payload);
    }
    clearSlotCache();
    return { success: true };
  } catch (error) {
    console.error('Lỗi khi lưu slot học sinh:', error);
    throw error;
  }
};

export const deleteStudentSlot = async (id) => {
  try {
    await deleteDoc(doc(db, SLOTS_COLLECTION, id));
    clearSlotCache();
    return true;
  } catch (error) {
    console.error('Lỗi khi xóa slot học sinh:', error);
    throw error;
  }
};


/**
 * Đồng bộ tất cả thay đổi của học sinh cùng lúc (Tạo mới, Cập nhật, Xóa)
 * @param {string} studentId
 * @param {Array} currentSlots Danh sách slot hiện tại trong bộ nhớ tạm
 * @param {Array} deletedIds Danh sách ID của các slot bị xóa
 */
export const syncStudentSlots = async (studentId, currentSlots, deletedIds = []) => {
  try {
    const batch = writeBatch(db);

    // 1. Xử lý các slot cần xóa
    deletedIds.forEach((id) => {
      // Chỉ xóa trên firestore nếu id không phải là id tạm thời (temp_...)
      if (!id.startsWith('temp_')) {
        const slotRef = doc(db, SLOTS_COLLECTION, id);
        batch.delete(slotRef);
      }
    });

    // 2. Xử lý các slot thêm mới hoặc cập nhật
    currentSlots.forEach((slot) => {
      const payload = {
        defaultSlotId: slot.defaultSlotId || '',
        studentId: studentId,
        studentName: slot.studentName || '',
        date: slot.date,
        status: slot.status || 'pending',
        note: slot.note || '',
        updatedAt: serverTimestamp(),
      };

      if (slot.id && !slot.id.startsWith('temp_')) {
        // Cập nhật slot đã có sẵn trên Firestore
        const docRef = doc(db, SLOTS_COLLECTION, slot.id);
        batch.update(docRef, payload);
      } else {
        // Tạo document mới cho slot vừa thêm
        const docRef = doc(collection(db, SLOTS_COLLECTION));
        payload.createdAt = serverTimestamp();
        batch.set(docRef, payload);
      }
    });

    await batch.commit();
    clearSlotCache();
    return { success: true };
  } catch (error) {
    console.error('Lỗi khi đồng bộ danh sách slot:', error);
    throw error;
  }
};