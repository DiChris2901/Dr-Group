import { initializeApp } from 'firebase/app';
import { getAuth, initializeAuth, getReactNativePersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Firebase configuration - Mismo proyecto que el dashboard web
const firebaseConfig = {
  apiKey: "AIzaSyDpjCcOe4CRvAdeClCskt0-jLQeXGf62tY",
  authDomain: "dr-group-cd21b.firebaseapp.com",
  projectId: "dr-group-cd21b",
  storageBucket: "dr-group-cd21b.firebasestorage.app",
  messagingSenderId: "629470690851",
  appId: "1:629470690851:web:cbda5f4b29c0a93bb17e97",
  databaseURL: "https://dr-group-cd21b-default-rtdb.firebaseio.com"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Auth with AsyncStorage persistence for React Native
const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage)
});

// Initialize Firestore
const db = getFirestore(app);

// Initialize Storage
const storage = getStorage(app);

export { auth, db, storage };
export default app;
