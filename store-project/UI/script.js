console.log("script.js is working!");
alert("JavaScript file is working!");

const hamMenu = document.querySelector(".ham-menu");

const offScreenMenu = document.querySelector(".off-screen-menu");

if (hamMenu && offScreenMenu) {
  hamMenu.addEventListener("click", () => {
    hamMenu.classList.toggle("active");
    offScreenMenu.classList.toggle("active");
  });
  console.log("Ham menu event listener attached");
} else {
  console.error("Ham menu or off-screen menu not found!");
}

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDUPV60SGFALV3si5L7qkX2zxl4UTxW6pU",
  authDomain: "prte-dw.firebaseapp.com",
  databaseURL: "https://prte-dw-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "prte-dw",
  storageBucket: "prte-dw.firebasestorage.app",
  messagingSenderId: "644047694920",
  appId: "1:644047694920:web:ba31fab647475d55f83c7d",
  measurementId: "G-MN59W6T8W7",
};

// Initialize Firebase
try {
  firebase.initializeApp(firebaseConfig);
  firebase.analytics();
  console.log("Firebase initialized successfully");
} catch (error) {
  console.error("Firebase initialization error:", error);
}

// Enable horizontal scrolling on main grid with mouse wheel
const mainGrid = document.querySelector(".main-grid");

if (mainGrid) {
  mainGrid.addEventListener(
    "wheel",
    (e) => {
      e.preventDefault();
      e.stopPropagation();
      mainGrid.scrollLeft += e.deltaY * 0.5;
    },
    { passive: false }
  );
  console.log("Wheel scroll listener attached to main grid");
} else {
  console.error("Main grid not found!");
}

// off-screen menu
//login button click event
const item = document.getElementById("log-in-button");

item.addEventListener("click", () => {
  alert("Item clicked!");
  window.location.href = "myaccount.html";
});


// auth.js — Google sign-in using Firebase CDN modules (ES module imports)
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-app.js";
import { getAuth, GoogleAuthProvider, signInWithPopup, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-auth.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-analytics.js";

console.log('auth.js loaded');

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
    const heading = document.getElementById('profile-name');
    if (heading) {
      heading.textContent = user.displayName || user.email;
    }
  } else {
    console.log('No user signed in');
  }
});


  