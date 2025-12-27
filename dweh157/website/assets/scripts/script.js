// ✅ Firebase ES module imports
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-app.js";
import {
  getFirestore,
  collection,
  getDocs,
  query,
  where,
  doc,
  getDoc,
  setDoc
} from "https://www.gstatic.com/firebasejs/12.6.0/firebase-firestore.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-auth.js";

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

// ✅ Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

/* ==================== DOM helpers ==================== */
const hamMenu = document.querySelector(".ham-menu");
const offScreenMenu = document.querySelector(".off-screen-menu");
if (hamMenu && offScreenMenu) {
  hamMenu.addEventListener("click", () => {
    hamMenu.classList.toggle("active");
    offScreenMenu.classList.toggle("active");
  });
}


function setCartBadge(count) {
  const shCard = document.getElementById("sh-card");
  if (shCard) {
    shCard.setAttribute("data-count", count);
  } else {
    console.warn("Missing #sh-card element for badge.");
  }
}

/* ==================== Add to Cart ==================== */
async function addToCart(userRef, productId) {
  if (!productId) {
    console.warn("Add to Cart click without productId.");
    return;
  }
  const cartItemRef = doc(userRef, "userCart", productId);
  const snap = await getDoc(cartItemRef);

  if (snap.exists()) {
    const currentQty = snap.data().quantity || 0;
    await setDoc(cartItemRef, { productId, quantity: currentQty + 1 }, { merge: true });
  } else {
    await setDoc(cartItemRef, { productId, quantity: 1 });
  }
}

/* ==================== Badge update ==================== */
async function updateCartBadge(userRef) {
  const cartRef = collection(userRef, "userCart");
  const snapshot = await getDocs(cartRef);

  let totalQty = 0;
  snapshot.forEach((docSnap) => {
    totalQty += docSnap.data().quantity || 0;
  });

  setCartBadge(totalQty);
}

/* ==================== Render products ==================== */
async function renderGrid({ containerId, filterType }) {
  const grid = document.getElementById(containerId);
  if (!grid) {
    console.error(`Missing #${containerId}`);
    return;
  }
  grid.innerHTML = "";

  const q = query(collection(db, "products"), where("type", "==", filterType));
  const snapshot = await getDocs(q);

  snapshot.forEach((docSnap) => {
    const { name, price, image } = docSnap.data();
    const productId = docSnap.id;

    const card = document.createElement("div");
    card.classList.add("tap-sensor");
    card.setAttribute("data-id", productId);
    card.innerHTML = `
      <div class="pr-card">
        <div class="price-box">
          <p class="price-number">${price}$</p>
        </div>
        <div class="pr-img-holder"></div>
        <img class="pr-img" src="${image || 'https://via.placeholder.com/300x300?text=No+Image'}" alt="Product" loading="lazy">
        <p class="pr-name">${name}</p>
        <div class="add-tint">
          <div class="add-to-cart">
            <img class="add-cart-img" src="../images/icons/ic_plus_white.png" alt="Add to cart">
          </div>
        </div>
      </div>
    `;

    const holder = card.querySelector(".pr-img-holder");
    const imgTag = card.querySelector(".pr-img");
    if (holder && imgTag && imgTag.src) {
      holder.style.backgroundImage = `url('${imgTag.src}')`;
      holder.style.backgroundSize = "cover";
      holder.style.backgroundPosition = "center";
    }

    grid.appendChild(card);
  });
}

/* ==================== Delegated cart clicks ==================== */
function wireCartClicks(userRef) {
  const containers = [
    document.getElementById("product-grid"),
    document.getElementById("product-grid2")
  ];

  const handler = async (e) => {
    const addBtn = e.target.closest(".add-to-cart");
    if (!addBtn) return;
    const card = e.target.closest(".tap-sensor");
    const productId = card?.dataset?.id;
    await addToCart(userRef, productId);
    await updateCartBadge(userRef);
  };

  containers.forEach((c) => c && c.addEventListener("click", handler));
}

/* ==================== Auth-driven flow ==================== */
onAuthStateChanged(auth, async (user) => {
  if (user) {
    const userRef = doc(db, "users", user.uid);

    // Render products
    await renderGrid({ containerId: "product-grid", filterType: "featured" });
    await renderGrid({ containerId: "product-grid2", filterType: "discounted" });

    // Wire cart clicks after render
    wireCartClicks(userRef);

    // Initial badge
    await updateCartBadge(userRef);
  } else {
    // Not signed in → render only
    await renderGrid({ containerId: "product-grid", filterType: "featured" });
    await renderGrid({ containerId: "product-grid2", filterType: "discounted" });
    setCartBadge(0);
    console.warn("Not signed in. Add to Cart requires authentication.");
  }
});