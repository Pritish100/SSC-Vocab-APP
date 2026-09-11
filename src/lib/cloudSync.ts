import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { WordToken, WordFamily } from '../types';

/**
 * Saves or updates a single word document under users/{userId}/words/{wordId}.
 */
export async function saveWordToCloud(userId: string, word: WordToken) {
  const wordRef = doc(db, 'users', userId, 'words', word.id);
  await setDoc(wordRef, word, { merge: true });
}

/**
 * Deletes a word document under users/{userId}/words/{wordId}.
 */
export async function deleteWordFromCloud(userId: string, wordId: string) {
  const wordRef = doc(db, 'users', userId, 'words', wordId);
  await deleteDoc(wordRef);
}

/**
 * Saves the entire user profile/metadata including word families.
 */
export async function saveUserDataToCloud(
  userId: string,
  data: { email?: string | null; displayName?: string | null; families: WordFamily[] }
) {
  const userRef = doc(db, 'users', userId);
  await setDoc(userRef, { ...data, updatedAt: Date.now() }, { merge: true });
}

/**
 * Batch-uploads an initial array of words and families when a user signs in
 * if their cloud store was previously empty.
 */
export async function bulkUploadToCloud(
  userId: string,
  words: WordToken[],
  families: WordFamily[],
  email?: string | null,
  displayName?: string | null
) {
  await saveUserDataToCloud(userId, { email, displayName, families });
  const promises = words.map((w) => saveWordToCloud(userId, w));
  await Promise.all(promises);
}

/**
 * Real-time listener for the user's words collection.
 */
export function subscribeToUserWords(
  userId: string,
  onWordsUpdated: (words: WordToken[]) => void,
  onError?: (err: Error) => void
) {
  const wordsCol = collection(db, 'users', userId, 'words');
  return onSnapshot(
    wordsCol,
    (snapshot) => {
      const list: WordToken[] = [];
      snapshot.forEach((docSnap) => {
        list.push(docSnap.data() as WordToken);
      });
      onWordsUpdated(list);
    },
    (err) => {
      console.error('Firestore subscription error:', err);
      onError?.(err);
    }
  );
}

/**
 * Real-time listener for the user's document (for families & preferences).
 */
export function subscribeToUserData(
  userId: string,
  onDataUpdated: (data: { families?: WordFamily[] }) => void,
  onError?: (err: Error) => void
) {
  const userRef = doc(db, 'users', userId);
  return onSnapshot(
    userRef,
    (docSnap) => {
      if (docSnap.exists()) {
        const d = docSnap.data();
        onDataUpdated({ families: d.families });
      } else {
        onDataUpdated({});
      }
    },
    (err) => {
      console.error('Firestore user doc subscription error:', err);
      onError?.(err);
    }
  );
}
