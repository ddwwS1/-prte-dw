// auth.js — Google sign-in using Firebase CDN modules (ES module imports)
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-app.js";
import { getAuth, GoogleAuthProvider, signInWithPopup, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-auth.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-analytics.js";
import { getFirestore, doc, setDoc } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-firestore.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-storage.js";



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

    const googlebtntxt = document.getElementById('sgn-w-google-txt');
    if (googlebtntxt) {
      googlebtntxt.textContent = "Change Google Account";
    }
    // Update profile picture if available
    const profilePicHolder = document.getElementById('profile-pic-holder');
    const profilePic = document.getElementById('profile-pic');
    if (profilePicHolder && profilePic) {
      if (user.photoURL) {
        profilePic.style.backgroundImage = `url(${user.photoURL})`;
        profilePicHolder.style.display = 'block';
      } else {
        profilePicHolder.style.display = 'none';
      }
    
  } else {
  
  }
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
      const db = getFirestore(app);
      const storage = getStorage(app);

      // Save user profile to Firestore (create or overwrite document at users/{uid})
      try {
        await setDoc(doc(db, "users", user.uid), {
          name: user.displayName || '',
          email: user.email || '',
          profilePicture: user.photoURL || '',
          createdAt: new Date().toISOString()
        });
        console.log('User data saved to Firestore for uid:', user.uid);
      } catch (e) {
        console.error('Failed to save user data to Firestore:', e);
      }

    } catch (err) {
      console.error('Sign-in failed:', err);
      alert('Sign-in failed: ' + (err?.message || err));
    }
  });
} else {
  console.error("Sign-in button with id 'sgn-w-google-btn' not found in the DOM.");
}


// Sign-in is handled via the click handler above; no extra automatic call here.
    
    

