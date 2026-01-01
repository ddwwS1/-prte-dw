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

    // Trigger animation
    shCard.classList.remove("bump"); // reset if already animating
    void shCard.offsetWidth; // force reflow to restart animation
    shCard.classList.add("bump");
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
    await firebase.setDoc(
      cartItemRef,
      { productId, quantity: currentQty + 1 },
      { merge: true }
    );
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

// ==================== Preview overlay ====================
function attachPreviewListeners(container) {
  const globalPreview = document.getElementById("global-preview");
  if (!globalPreview) return;

  let activeCard = null;
  let hoverTimer = null;

  const showPreview = (card) => {
    const name = card.querySelector(".pr-name")?.textContent || "";
    const imgEl = card.querySelector(".pr-img");
    if (!imgEl) return;

    globalPreview.innerHTML = `
      <h4>Quick Preview</h4>
      <img src="${imgEl.src}" alt="${name}" style="max-width:200px;display:block;margin-bottom:8px;">
      <p>${name}</p>
      <a href="product.html?id=${card.dataset.id}">View full page</a>
    `;

    const rect = card.getBoundingClientRect();
    const offset = 6; // small gap to avoid boundary flicker
    globalPreview.style.top = rect.bottom + offset + "px";
    globalPreview.style.left = rect.left + "px";

    const applyColor = () => {
      try {
        const color = getDominantColor(imgEl);
        globalPreview.style.backgroundColor = color;
      } catch (e) {
        // If canvas is tainted due to CORS, skip color
      }
    };
    if (imgEl.complete) applyColor();
    else imgEl.onload = applyColor;

    globalPreview.classList.add("show");
    card.classList.add("hovering"); // simulate :hover
    activeCard = card;
  };

  const hidePreview = () => {
    globalPreview.classList.remove("show");
    if (activeCard) {
      activeCard.classList.remove("hovering");
      activeCard = null;
    }
  };

  container.querySelectorAll(".pr-card").forEach((card) => {
    card.addEventListener("mouseenter", () => {
      clearTimeout(hoverTimer);
      hoverTimer = setTimeout(() => showPreview(card), 600);
    });

    card.addEventListener("mouseleave", (e) => {
      clearTimeout(hoverTimer);
      const to = e.relatedTarget;
      // If moving into the preview, keep hover
      if (to && globalPreview.contains(to)) return;

      // Otherwise, if neither card nor preview is under the cursor after a short delay, hide
      setTimeout(() => {
        if (!card.matches(":hover") && !globalPreview.matches(":hover")) {
          if (activeCard === card) hidePreview();
        }
      }, 150);
    });
  });

  // Entering the preview keeps the active card hovered
  globalPreview.addEventListener("mouseenter", () => {
    // no-op: staying on preview should keep activeCard hovered
  });

  // Leaving the preview: only hide if not returning to the active card
  globalPreview.addEventListener("mouseleave", (e) => {
    const to = e.relatedTarget;
    if (to && activeCard && activeCard.contains(to)) return; // moved back to card
    hidePreview();
  });
}
/* ==================== Render products ==================== */
async function renderGrid({ containerId, filterType }) {
  const grid = document.getElementById(containerId);
  if (!grid) {
    console.error(`Missing #${containerId}`);
    return;
  }
  grid.innerHTML = "";

  const q = firebase.query(
    firebase.collection(firebase.db, "products"),
    firebase.where("type", "==", filterType)
  );
  const snapshot = await firebase.getDocs(q);

  snapshot.forEach((docSnap) => {
    const { name, price, image } = docSnap.data();
    const productId = docSnap.id;
    const displayPrice = (Number(price) / 100).toFixed(2); // convert cents → dollars

    const card = document.createElement("div");
    card.classList.add("tap-sensor");
    card.setAttribute("data-id", productId);
    card.innerHTML = `
  <div class="pr-card">
    <div class="price-box">
      <p class="price-number">$${displayPrice}</p>
    </div>
    <div class="pr-img-holder"></div>
    <img class="pr-img" src="${image || "https://via.placeholder.com/300x300?text=No+Image"}" alt="Product" loading="lazy">
    <p class="pr-name">${name}</p>
    <div class="add-tint">
      <div class="add-to-cart">
        <img class="add-cart-img" src="../images/icons/ic_plus_white.png" alt="Add to cart">
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
  attachPreviewListeners(grid);
}



/* ==================== Delegated cart clicks ==================== */
function wireCartClicks(userRef) {
  const containers = [
    document.getElementById("product-grid"),
    document.getElementById("product-grid2"),
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
    await renderGrid({
      containerId: "product-grid2",
      filterType: "discounted",
    });

    // Wire cart clicks after render
    wireCartClicks(userRef);

    // Initial badge
    await updateCartBadge(userRef);
  } else {
    // Not signed in → render only
    await renderGrid({ containerId: "product-grid", filterType: "featured" });
    await renderGrid({
      containerId: "product-grid2",
      filterType: "discounted",
    });
    setCartBadge(0);
    console.warn("Not signed in. Add to Cart requires authentication.");
  }
});

// enable horizontal scroll for product grids
function enableHorizontalScroll(containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;

  container.addEventListener("wheel", (e) => {
    e.preventDefault();
    container.scrollLeft += e.deltaY; // scroll horizontally with vertical wheel
  });
}

// Apply to both grids
enableHorizontalScroll("product-grid");
enableHorizontalScroll("product-grid2");

// ==================== Cart toggle ====================
const shCard = document.getElementById("sh-card");
const cart = document.getElementById("cart");
const overlay = document.getElementById("overlay");
const closeBtn = document.getElementById("close-cart");

function toggleCart() {
  cart.classList.toggle("hidden");
  overlay.classList.toggle("hidden");

  if (!cart.classList.contains("hidden")) {
    cart.focus();
    loadCart(); // load cart contents when opened
  }
}

if (shCard) shCard.addEventListener("click", toggleCart);
if (closeBtn) closeBtn.addEventListener("click", toggleCart);

// ✅ Overlay should always close
if (overlay)
  overlay.addEventListener("click", () => {
    cart.classList.add("hidden");
    overlay.classList.add("hidden");
  });

// ==================== Load Cart ====================
async function loadCart() {
  const uid = firebase.auth.currentUser?.uid;
  if (!uid) {
    console.warn("No user signed in");
    return;
  }

  const cartContainer = document.getElementById("cart-items");
  cartContainer.innerHTML = "";
  let totalCents = 0;

  
  const cartSnapshot = await firebase.getDocs(
    firebase.collection(firebase.db, `users/${uid}/userCart`)
  );

  

    // ✅ If cart is empty
  if (cartSnapshot.empty) {
    cartContainer.innerHTML = `<p class="empty-cart">Your cart is empty</p>`;
    document.getElementById("cart-total").textContent = "Total: $0.00";
    return;
  }


  for (const cartDoc of cartSnapshot.docs) {
    const { productId, quantity } = cartDoc.data();
    const productSnap = await firebase.getDoc(
      firebase.doc(firebase.db, "products", productId)
    );

    if (productSnap.exists()) {
      const product = productSnap.data();
      const priceCents = Number(product.price) || 0;
      const imgSrc =
        product.image || "https://via.placeholder.com/150?text=No+Image";

      const itemDiv = document.createElement("div");
      itemDiv.className = "cart-item";
      itemDiv.innerHTML = `
      <div class="cart-item-info">
      <img src="${imgSrc}" alt="${product.name}">
      </div>
      <div class="cart-item-details">
       <span class="cart-item-name"><strong>${product.name}</strong></span>
       <span class="cart-item-price">$${(priceCents / 100).toFixed(2)}</span>
       </div>
       <div class="cart-controls">
      <button class="decrease">-</button>
      <input type="number" value="${quantity}" min="1">
      <button class="increase">+</button>
      <button class="remove">Remove</button>
      </div>
      `;

      // ✅ attach listeners INSIDE the loop
      const qtyInput = itemDiv.querySelector("input[type='number']");
      const increaseBtn = itemDiv.querySelector(".increase");
      const decreaseBtn = itemDiv.querySelector(".decrease");
      const removeBtn = itemDiv.querySelector(".remove");

      qtyInput.addEventListener("change", async (e) => {
        const newQty = parseInt(e.target.value, 10);
        if (newQty > 0) {
          await firebase.updateDoc(cartDoc.ref, { quantity: newQty });
          loadCart();
        } else {
          await firebase.deleteDoc(cartDoc.ref);
          loadCart();
        }
      });

      increaseBtn.addEventListener("click", async () => {
        await firebase.updateDoc(cartDoc.ref, { quantity: quantity + 1 });
        loadCart();
      });

      decreaseBtn.addEventListener("click", async () => {
        if (quantity > 1) {
          await firebase.updateDoc(cartDoc.ref, { quantity: quantity - 1 });
        } else {
          await firebase.deleteDoc(cartDoc.ref);
        }
        loadCart();
      });

      removeBtn.addEventListener("click", async () => {
        await firebase.deleteDoc(cartDoc.ref);
        loadCart();
      });

      cartContainer.appendChild(itemDiv);

      totalCents += priceCents * quantity;
    }
  }

  document.getElementById("cart-total").textContent = `Total: $${(
    totalCents / 100
  ).toFixed(2)}`;
}

