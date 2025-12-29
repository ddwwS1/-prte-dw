// script.js
import * as firebase from "./firebase.js";

/* ==================== DOM helpers ==================== */
const hamMenu = document.querySelector(".ham-menu");
const offScreenMenu = document.querySelector(".off-screen-menu");
if (hamMenu && offScreenMenu) {
  hamMenu.addEventListener("click", () => {
    hamMenu.classList.toggle("active");
    offScreenMenu.classList.toggle("active");
  });
}

const item = document.getElementById("profile-button");
if (item) {
  item.addEventListener("click", () => {
    window.location.href = "myaccount.html";
  });
}

// Search toggle
const searchIcon = document.getElementById("mag-card");
const inputField = document.getElementById("src_bar");
if (searchIcon && inputField) {
  searchIcon.addEventListener("click", () => {
    inputField.classList.toggle("tog");
  });
}
document.addEventListener("keydown", function (e) {
  if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA") return;
  if (e.code === "KeyF") {
    inputField.classList.toggle("tog");
  }
});

/* ==================== Cart badge ==================== */
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
  const cartItemRef = firebase.doc(userRef, "userCart", productId);
  const snap = await firebase.getDoc(cartItemRef);

  if (snap.exists()) {
    const currentQty = snap.data().quantity || 0;
    await firebase.setDoc(cartItemRef, { productId, quantity: currentQty + 1 }, { merge: true });
  } else {
    await firebase.setDoc(cartItemRef, { productId, quantity: 1 });
  }
}

/* ==================== Badge update ==================== */
async function updateCartBadge(userRef) {
  const cartRef = firebase.collection(userRef, "userCart");
  const snapshot = await firebase.getDocs(cartRef);

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

  const q = firebase.query(firebase.collection(firebase.db, "products"), firebase.where("type", "==", filterType));
  const snapshot = await firebase.getDocs(q);

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
firebase.onAuthStateChanged(firebase.auth, async (user) => {
  if (user) {
    const userRef = firebase.doc(firebase.db, "users", user.uid);
    const heading = document.getElementById("profile-name");
    const img = document.getElementById("profile-img");
    if (heading) heading.textContent = user.displayName || user.email;
    if (img) img.src = user.photoURL;

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