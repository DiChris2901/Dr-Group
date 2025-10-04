// Import the functions you need from the SDKs you need
import { initializeApp } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getStorage, connectStorageEmulator } from 'firebase/storage';
import { getFunctions, connectFunctionsEmulator } from 'firebase/functions';
import { getDatabase, connectDatabaseEmulator } from 'firebase/database';

// Firebase configuration usando variables de entorno
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  databaseURL: `https://${import.meta.env.VITE_FIREBASE_PROJECT_ID}-default-rtdb.firebaseio.com`
};

// Validar configuración antes de inicializar
if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
  console.error('🚨 Firebase configuration is missing required fields');
  throw new Error('Firebase configuration is incomplete');
}

// Initialize Firebase
let app;
try {
  app = initializeApp(firebaseConfig);
  console.log('✅ Firebase app initialized successfully');
} catch (error) {
  console.error('🚨 Error initializing Firebase:', error);
  throw error;
}

// Initialize Firebase Authentication and get a reference to the service
let auth;
try {
  auth = getAuth(app);
  console.log('✅ Firebase Auth initialized successfully');
} catch (error) {
  console.error('🚨 Error initializing Firebase Auth:', error);
  throw error;
}

// Initialize Cloud Firestore and get a reference to the service
let db;
try {
  db = getFirestore(app);
  console.log('✅ Firestore initialized successfully');
} catch (error) {
  console.error('🚨 Error initializing Firestore:', error);
  throw error;
}

// Initialize Cloud Storage and get a reference to the service
let storage;
try {
  storage = getStorage(app);
  console.log('✅ Firebase Storage initialized successfully');
} catch (error) {
  console.error('🚨 Error initializing Firebase Storage:', error);
  throw error;
}

// Initialize Cloud Functions and get a reference to the service
let functions;
try {
  functions = getFunctions(app);
  
  // Conectar al emulador en desarrollo
  if (import.meta.env.DEV) {
    console.log('🔧 Conectando Functions al emulador local...');
    connectFunctionsEmulator(functions, 'localhost', 5001);
  }
  
  console.log('✅ Firebase Functions initialized successfully');
} catch (error) {
  console.error('🚨 Error initializing Firebase Functions:', error);
  throw error;
}

// Initialize Realtime Database for presence system
let database;
try {
  database = getDatabase(app);
  console.log('✅ Firebase Realtime Database initialized successfully');
} catch (error) {
  console.error('🚨 Error initializing Realtime Database:', error);
  console.warn('⚠️ La aplicación funcionará sin el sistema de presencia');
}

export { auth, db, storage, functions, database };
export default app;
