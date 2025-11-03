// Firebase initialization using v11 modular CDN SDK
// Fill in your Firebase project's credentials below.

import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-storage.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyB8kdUc2qGzaAfqcb9phuW5m3y6TbCwkmg",
  authDomain: "smart-restaurant-7f26a.firebaseapp.com",
  projectId: "smart-restaurant-7f26a",
  storageBucket: "smart-restaurant-7f26a.appspot.com",
  messagingSenderId: "229726609927",
  appId: "1:229726609927:web:ea8cab614bebeee0f8c0a2",
  measurementId: "G-LZNYJWQD5V"
};

const isFilled = Object.values(firebaseConfig).every(v => typeof v === 'string' && v && !v.includes('YOUR_'));

let app = null;
let db = null;
let storage = null;
let auth = null;
let firebaseReady = false;

try {
  app = initializeApp(firebaseConfig);
  db = getFirestore(app);
  storage = getStorage(app);
  auth = getAuth(app);
  firebaseReady = isFilled;
} catch (e) {
  // If config invalid, keep firebaseReady false to use dummy data or disable admin actions.
  firebaseReady = false;
}

export { app, db, storage, auth, firebaseReady };
