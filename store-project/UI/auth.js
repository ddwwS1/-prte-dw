// auth.js — Google sign-in using Firebase CDN modules (ES module imports)
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-app.js";
import { getAuth, GoogleAuthProvider, signInWithPopup, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-auth.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-analytics.js";

console.log('auth.js loaded');

// Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyDUPV60SGFALV3si5L7qkX2zxl4UTxW6pU",
  authDomain: "prte-dw.firebaseapp.com",
  databaseURL: "https://prte-dw-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "prte-dw",
  storageBucket: "prte-dw.firebasestorage.app",
  messagingSenderId: "644047694920",
  appId: "1:644047694920:web:ba31fab647475d55f83c7d",
  measurementId: "G-MN59W6T8W7"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
try {
  getAnalytics(app);
} catch (e) {
  console.warn('Analytics not available:', e?.message || e);
}

// Auth setup
const auth = getAuth(app);
const provider = new GoogleAuthProvider();
auth.languageCode = 'en';

onAuthStateChanged(auth, (user) => {
  if (user) {
    console.log('User signed in:', user.displayName || user.email);
    
    // Update username heading if signed in
    const heading = document.getElementById('username');
    if (heading) {
      heading.textContent = user.displayName || user.email;
    }
  } else {
    console.log('No user signed in');
  }
});

// Sign-in button — use popup
const item = document.getElementById('sgn-w-google-btn');
if (item) {
  item.addEventListener('click', async () => {
    try {
      console.log('Attempting sign-in with popup; origin:', location.origin);
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      console.log('Sign-in successful:', user.displayName || user.email);
      
    } catch (err) {
      console.error('Sign-in failed:', err);
      alert('Sign-in failed: ' + (err?.message || err));
    }
  });
} else {
  console.error("Sign-in button with id 'sgn-w-google-btn' not found in the DOM.");
}


signInWithPopup(auth, provider)
    .then((result) => {
    const user = result.user;
    console.log("UID:", user.uid);
    console.log("Name:", user.displayName);
    console.log("Email:", user.email);
    console.log("Photo:", user.photoURL);
    });