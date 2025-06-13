
import { initializeApp, getApp, getApps, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';
import { getStorage, type FirebaseStorage } from 'firebase/storage';
import { getAnalytics, type Analytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyCl-hM0gx9iEymUrKUtg0DMM23oyEEJB0k",
  authDomain: "gvm-gestor.firebaseapp.com",
  projectId: "gvm-gestor",
  storageBucket: "gvm-gestor.firebasestorage.app",
  messagingSenderId: "1086713631712",
  appId: "1:1086713631712:web:8d053239b94daf7bf69185",
  measurementId: "G-WEK3FN0KRK"
};

// Inicializa o Firebase
let app: FirebaseApp;
let analytics: Analytics | undefined;

if (!getApps().length) {
  app = initializeApp(firebaseConfig);
  if (typeof window !== 'undefined') {
    // Inicializa o Analytics apenas no lado do cliente
    analytics = getAnalytics(app);
  }
} else {
  app = getApp();
  if (typeof window !== 'undefined') {
    // Garante que o analytics seja obtido se o app já foi inicializado
    analytics = getAnalytics(app);
  }
}

const auth: Auth = getAuth(app);
const db: Firestore = getFirestore(app);
const storage: FirebaseStorage = getStorage(app);

export { app, auth, db, storage, analytics };
