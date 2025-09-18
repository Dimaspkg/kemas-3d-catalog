import { initializeApp, getApp, getApps } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  "projectId": "studio-3252810572-56c54",
  "appId": "1:597994481713:web:0f4fb09e196be720ae0d10",
  "storageBucket": "studio-3252810572-56c54.firebasestorage.app",
  "apiKey": "AIzaSyCPUCPtcgntNFw2kHKrkGPJH4NYs9412CQ",
  "authDomain": "studio-3252810572-56c54.firebaseapp.com",
  "measurementId": "",
  "messagingSenderId": "597994481713"
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app);
const storage = getStorage(app);

export { app, db, storage };
