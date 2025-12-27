// auth.js — Google sign-in using Firebase CDN modules (ES module imports)
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-app.js";
import { getAuth, GoogleAuthProvider, signInWithPopup, onAuthStateChanged, signOut } 
  from "https://www.gstatic.com/firebasejs/12.6.0/firebase-auth.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-analytics.js";
import { getFirestore, doc, setDoc, getDoc, collection, addDoc } 
  from "https://www.gstatic.com/firebasejs/12.6.0/firebase-firestore.js";
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
try { getAnalytics(app); } catch (e) { console.warn('Analytics not available:', e?.message || e); }

// Auth setup
const auth = getAuth(app);
const provider = new GoogleAuthProvider();
auth.languageCode = 'en';

// Firestore + Storage
const db = getFirestore(app);
const storage = getStorage(app);

// Helper: update DOM info section
function updateInfoSection(data) {
  const emailTxt = document.getElementById('email-txt');
  const phoneTxt = document.getElementById('phonenum-txt');
  const addressTxt = document.getElementById('address-txt');

  if (emailTxt) emailTxt.textContent = "Gmail : " + (data.email || "none");
  if (phoneTxt) phoneTxt.textContent = "Phone number : " + (data.phoneNumber || "none");
  if (addressTxt) addressTxt.textContent = "Address : " + (data.address || "none");
}

// Auth state listener
onAuthStateChanged(auth, async (user) => {
  if (user) {
    console.log('User signed in:', user.displayName || user.email);

    const heading = document.getElementById('username');
    if (heading) heading.textContent = user.displayName || user.email;

    const googlebtntxt = document.getElementById('sgn-w-google-txt');
    if (googlebtntxt) googlebtntxt.textContent = "Change Google Account";

    const profilePicHolder = document.getElementById('profile-pic-holder');
    const profilePic = document.getElementById('profile-pic');
    if (profilePicHolder && profilePic) {
      if (user.photoURL) {
        profilePic.style.backgroundImage = `url(${user.photoURL})`;
        profilePicHolder.style.display = 'block';
      } else {
        profilePicHolder.style.display = 'none';
      }
    }

    try {
      const userRef = doc(db, "users", user.uid);
      const snap = await getDoc(userRef);

      if (snap.exists()) {
        const data = snap.data();
        console.log("User doc found:", data);

        if (!data.address || !data.phoneNumber) {
          await setDoc(userRef, {
            address: data.address || "123 Main Street, Konya, Türkiye",
            phoneNumber: data.phoneNumber || "+90 555 123 4567"
          }, { merge: true });
        }

        updateInfoSection(data);
      } else {
        const newData = {
          name: user.displayName || '',
          email: user.email || '',
          profilePicture: user.photoURL || '',
          createdAt: new Date().toISOString(),
          address: "",
          phoneNumber: ""
        };
        await setDoc(userRef, newData);
        updateInfoSection(newData);
      }
    } catch (e) {
      console.error("Failed to save user data:", e);
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

      const userRef = doc(db, "users", user.uid);
      await setDoc(userRef, {
        name: user.displayName || '',
        email: user.email || '',
        profilePicture: user.photoURL || '',
        createdAt: new Date().toISOString(),
        address: "",
        phoneNumber: ""
      }, { merge: true });

      const ordersRef = collection(userRef, "orders");
      await addDoc(ordersRef, {
        product: "Welcome Gift",
        price: 0,
        createdAt: new Date().toISOString()
      });

      console.log("User doc and subcollection created successfully");
    } catch (err) {
      console.error('Sign-in failed:', err);
      alert('Sign-in failed: ' + (err?.message || err));
    }
  });
} else {
  console.error("Sign-in button with id 'sgn-w-google-btn' not found in the DOM.");
}

// Menu buttons
document.getElementById("my-info-btn").addEventListener("click", () => {
  document.getElementById("page-1").style.display = "block";
  document.getElementById("page-2").style.display = "none";
  document.getElementById("page-3").style.display = "none";
  document.getElementById("page-4").style.display = "none";
});

document.getElementById("my-address-btn").addEventListener("click", () => {
  document.getElementById("page-2").style.display = "block";
  document.getElementById("page-1").style.display = "none";
  document.getElementById("page-3").style.display = "none";
  document.getElementById("page-4").style.display = "none";
});

document.getElementById("payment-methods-btn").addEventListener("click", () => {
  document.getElementById("page-3").style.display = "block";
  document.getElementById("page-1").style.display = "none";
  document.getElementById("page-2").style.display = "none";
  document.getElementById("page-4").style.display = "none";
});

document.getElementById("order-history-btn").addEventListener("click", () => {
  document.getElementById("page-4").style.display = "block";
  document.getElementById("page-1").style.display = "none";
  document.getElementById("page-2").style.display = "none";
  document.getElementById("page-3").style.display = "none";
});

// Sign out button (modular signOut)
document.getElementById("sign-out-btn").addEventListener("click", async () => {
  try {
    await signOut(auth);
    console.log("User signed out successfully");
    window.location.href = "index.html";
  } catch (error) {
    console.error("Error signing out:", error);
  }
});