// ✅ Firebase ES module imports
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-app.js";
import { getFirestore, collection, getDocs } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-firestore.js";
import { getAuth, GoogleAuthProvider, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-auth.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-analytics.js";

// ✅ Firebase config
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

// ✅ Initialize Firebase once
const app = initializeApp(firebaseConfig);
getAnalytics(app);
const db = getFirestore(app);
const auth = getAuth(app);

// ✅ UI: Hamburger menu
const hamMenu = document.querySelector(".ham-menu");
const offScreenMenu = document.querySelector(".off-screen-menu");
if (hamMenu && offScreenMenu) {
  hamMenu.addEventListener("click", () => {
    hamMenu.classList.toggle("active");
    offScreenMenu.classList.toggle("active");
  });
}

// ✅ UI: Horizontal scroll
const mainGrid = document.querySelector(".main-grid");
if (mainGrid) {
  mainGrid.addEventListener("wheel", (e) => {
    e.preventDefault();
    mainGrid.scrollLeft += e.deltaY * 0.5;
  }, { passive: false });
}

// ✅ UI: Profile button
const item = document.getElementById("profile-button");
if (item) {
  item.addEventListener("click", () => {
    window.location.href = "myaccount.html";
  });
}

// ✅ Auth state listener
onAuthStateChanged(auth, (user) => {
  const heading = document.getElementById("profile-name");
  const img = document.getElementById("profile-img");
  if (user) {
    if (heading) heading.textContent = user.displayName || user.email;
    if (img) img.src = user.photoURL;
  }
});

// ✅ Load products from Firestore
async function loadProducts() {
  const grid = document.getElementById("product-grid");
  if (!grid) return console.error("Missing #product-grid");

  grid.innerHTML = "";

  try {
    const snapshot = await getDocs(collection(db, "products"));
    snapshot.forEach((doc) => {
      const { name, price, image } = doc.data();

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

// ✅ Run on page load
loadProducts();