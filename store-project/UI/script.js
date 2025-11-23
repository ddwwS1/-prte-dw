import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.2/firebase-app.js";
import { getFirestore, collection, getDocs } from "https://www.gstatic.com/firebasejs/10.7.2/firebase-firestore.js";

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

console.log("script.js is working!");

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
const item = document.getElementById("profile-button");

item.addEventListener("click", () => {
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
    document.getElementById("profile-img").src = user.photoURL;
    if (heading) {
      heading.textContent = user.displayName || user.email;
    }
  } else {
    console.log('No user signed in');
  }
});

const db = getFirestore(app);

// Function to load products
async function loadProducts() {
  const grid = document.getElementById("product-grid");
  if (!grid) return console.error("Missing #product-grid");

  grid.innerHTML = "";

  try {
    const snapshot = await getDocs(collection(db, "products"));
    snapshot.forEach((doc) => {
      const { name, price, description, image } = doc.data();

      const card = document.createElement("div");
      card.classList.add("tap-sensor");
      card.innerHTML = `
        <div class="pr-card">
          <div class="price-box">
            <p class="price-number">${price}$</p>
          </div>
          <img class="pr-img" src="${image || 'https://via.placeholder.com/300x300?text=No+Image'}">
          <p class="pr-name">${name}</p>
          <div class="add-tint">
            <div class="add-to-cart">
              <img class="add-cart-img" src="https://github.com/ddwwS1/-prte-dw/blob/main/store-project/UI/icons/ic_plus_white.png?raw=true">
            </div>
          </div>
        </div>
      `;
      grid.appendChild(card);
    });
  } catch (err) {
    console.error("Failed to load products:", err);
  }
}

// Run on page load
loadProducts();
