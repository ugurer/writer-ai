import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from 'firebase/auth';
import { getFirestore, collection, doc, setDoc, getDoc, updateDoc, deleteDoc, query, where, getDocs } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import {
  FIREBASE_API_KEY,
  FIREBASE_AUTH_DOMAIN,
  FIREBASE_PROJECT_ID,
  FIREBASE_STORAGE_BUCKET,
  FIREBASE_MESSAGING_SENDER_ID,
  FIREBASE_APP_ID,
} from '@env';

const firebaseConfig = {
  apiKey: FIREBASE_API_KEY,
  authDomain: FIREBASE_AUTH_DOMAIN,
  projectId: FIREBASE_PROJECT_ID,
  storageBucket: FIREBASE_STORAGE_BUCKET,
  messagingSenderId: FIREBASE_MESSAGING_SENDER_ID,
  appId: FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

export const signIn = async (email: string, password: string) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return userCredential.user;
  } catch (error) {
    throw error;
  }
};

export const signUp = async (email: string, password: string) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    return userCredential.user;
  } catch (error) {
    throw error;
  }
};

export const logOut = async () => {
  try {
    await signOut(auth);
  } catch (error) {
    throw error;
  }
};

export const createDocument = async <T extends { id: string }>(
  collectionName: string,
  data: T
) => {
  try {
    await setDoc(doc(db, collectionName, data.id), data);
    return data;
  } catch (error) {
    throw error;
  }
};

export const getDocument = async <T>(
  collectionName: string,
  id: string
): Promise<T | null> => {
  try {
    const docRef = doc(db, collectionName, id);
    const docSnap = await getDoc(docRef);
    return docSnap.exists() ? (docSnap.data() as T) : null;
  } catch (error) {
    throw error;
  }
};

export const updateDocument = async <T extends { id: string }>(
  collectionName: string,
  data: Partial<T> & { id: string }
) => {
  try {
    const docRef = doc(db, collectionName, data.id);
    await updateDoc(docRef, data);
    return data;
  } catch (error) {
    throw error;
  }
};

export const deleteDocument = async (collectionName: string, id: string) => {
  try {
    await deleteDoc(doc(db, collectionName, id));
  } catch (error) {
    throw error;
  }
};

export const queryDocuments = async <T>(
  collectionName: string,
  field: string,
  operator: '==' | '!=' | '>' | '<' | '>=' | '<=',
  value: any
): Promise<T[]> => {
  try {
    const q = query(collection(db, collectionName), where(field, operator, value));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => doc.data() as T);
  } catch (error) {
    throw error;
  }
};

export const uploadFile = async (path: string, file: Blob): Promise<string> => {
  try {
    const storageRef = ref(storage, path);
    await uploadBytes(storageRef, file);
    return await getDownloadURL(storageRef);
  } catch (error) {
    throw error;
  }
}; 