// script.js
import * as firebase from "./firebase.js";

/*===================== GLOBAL STYLE ==================== */
// Select all elements
document.getElementById("menu_bar").classList.add("neumorphic");

/* ==================== DOM helpers ==================== */
const hamMenu = document.querySelector(".ham-menu");
const offScreenMenu = document.querySelector(".off-screen-menu");
if (hamMenu && offScreenMenu) {
  hamMenu.addEventListener("click", () => {
    hamMenu.classList.toggle("active");
    if (offScreenMenu) {
      offScreenMenu.classList.toggle("active");
    }
  });
}

const item = document.getElementById("profile-button");
if (item) {
  item.addEventListener("click", () => {
    window.location.href = "myaccount.html";
  });
}

const profileCard = document.getElementById("profile-card");
if (profileCard) {
  profileCard.addEventListener("click", () => {
    window.location.href = "myaccount.html";
  });
}

const homeBtn = document.getElementById("home-button");
if (homeBtn) {
  homeBtn.addEventListener("click", () => {
    window.location.href = "index.html";
  });
}

const reviewsBtn = document.getElementById("reviews-button");
if (reviewsBtn) {
  reviewsBtn.addEventListener("click", () => {
    window.location.href = "reviews.html";
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

/* ==================== Add to Wish ==================== */
async function addToWishs(userRef, productId) {
  if (!productId) {
    console.warn("Add to Wish click without productId.");
    return;
  }

  // userRef is a DocumentReference; pass it directly to collection()
  const wishCollectionRef = firebase.collection(userRef, "userWishs");
  const wishItemRef = firebase.doc(wishCollectionRef, productId);

  try {
    const snap = await firebase.getDoc(wishItemRef);

    if (!snap.exists()) {
      // Just store productId (no quantity)
      await firebase.setDoc(wishItemRef, {
        productId,
        addedAt: firebase.serverTimestamp() // optional timestamp
      });
    } else {
      console.info("Product already in wishlist.");
    }
  } catch (err) {
    console.error("Failed to add to wishlist:", err);
  }
}

/* ==================== Remove from Wish ==================== */
async function removeFromWishs(userRef, productId) {
  if (!productId) {
    console.warn("Remove from Wish click without productId.");
    return;
  }

  const wishCollectionRef = firebase.collection(userRef, "userWishs");
  const wishItemRef = firebase.doc(wishCollectionRef, productId);

  try {
    const snap = await firebase.getDoc(wishItemRef);

    if (snap.exists()) {
      await firebase.deleteDoc(wishItemRef);
      console.info("Product removed from wishlist.");
    } else {
      console.info("Product not found in wishlist.");
    }
  } catch (err) {
    console.error("Failed to remove from wishlist:", err);
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
function attachPreviewListeners(container, userRef) {
  const globalPreview = document.getElementById("global-preview");
  if (!globalPreview) return;

  let activeCard = null;
  let hoverTimer = null;

  const normalizeImages = (product, fallback) => {
    const raw =
      product?.images ??
      product?.image ??
      product?.gallery ??
      product?.photos;

    if (Array.isArray(raw)) {
      return raw.filter((u) => typeof u === "string" && u.length);
    }
    if (typeof raw === "string" && raw.length) {
      return [raw];
    }
    if (raw && typeof raw === "object") {
      const vals = Object.values(raw).filter((u) => typeof u === "string" && u.length);
      if (vals.length) return vals;
    }
    return [fallback];
  };

  const showPreview = async (card) => {
    const rect = card.getBoundingClientRect();
    const offset = 6;
    const name = card.querySelector(".pr-name")?.textContent || "";
    const imgEl = card.querySelector(".pr-img");
    if (!imgEl) return;

    const productId = card.dataset.id;
    if (!productId) {
      console.warn("Preview: missing data-id on card, skipping.");
      return;
    }

    let product = null;
    try {
      const snap = await firebase.getDoc(
        firebase.doc(firebase.db, "products", productId)
      );
      if (snap.exists()) {
        product = snap.data();
      }
    } catch (err) {
      console.error("Firestore fetch failed:", err);
    }

    // Load product reviews for rating and count
    let averageRating = 0;
    let reviewCount = 0;
    try {
      const reviewsSnap = await firebase.getDocs(firebase.collection(firebase.db, 'products', productId, 'product-reviews'));
      if (!reviewsSnap.empty) {
        let totalStars = 0;
        reviewCount = reviewsSnap.size;
        reviewsSnap.forEach((doc) => {
          const review = doc.data();
          totalStars += review.stars || 0;
        });
        averageRating = reviewCount > 0 ? Math.round(totalStars / reviewCount) : 0;
      }
    } catch (err) {
      console.error("Failed to load reviews:", err);
    }

    const images = normalizeImages(product, imgEl.src);
    let currentIndex = 0;

    globalPreview.innerHTML = `
      <div id="pre-title-holder"> 
        <h4 id="pre-title">Quick Preview</h4>
        <h4 id="pre-seller-txt">seller: ${product?.seller || "Unknown"}</h4> 
      </div>
      <div id="pre-img-holder">
        <img id="pre-img" src="${images[0]}" alt="${name}">
        <div id="pre-img-tint" ${images.length > 1 ? "" : 'style="display:none;"'}>
          <img id="pre-next-img" src="../images/icons/ic_next_white.svg" alt="next">
        </div>
      </div>
      <div id="pre-rating">
        <div class="stars">
          <span class="${averageRating >= 1 ? 'filled' : ''}">★</span>
          <span class="${averageRating >= 2 ? 'filled' : ''}">★</span>
          <span class="${averageRating >= 3 ? 'filled' : ''}">★</span>
          <span class="${averageRating >= 4 ? 'filled' : ''}">★</span>
          <span class="${averageRating >= 5 ? 'filled' : ''}">★</span>
        </div>
        <div id="review-count">(${reviewCount})</div>
        <div id="pre-see-reviews"><h3>all reviews</h3></div>
        <div id="pre-add-to-wish"><h3>wishlist</h3></div>
      </div>

      <p id="pre-title">${name}</p>
      <a href="product.html?id=${productId}">View full page</a>
    `;

    const previewWidth = globalPreview.offsetWidth;
    const cardCenter = rect.left + rect.width / 2;
    globalPreview.style.left = cardCenter - previewWidth / 2 + "px";
    globalPreview.style.top = rect.bottom + offset + "px";

    const preImg = globalPreview.querySelector("#pre-img");
    const preImgTint = globalPreview.querySelector("#pre-img-tint");

    if (images.length > 1 && preImgTint) {
      preImgTint.addEventListener("click", () => {
        // Smooth image transition with load detection
        preImg.style.opacity = '0';
        setTimeout(() => {
          currentIndex = (currentIndex + 1) % images.length;
          const newSrc = images[currentIndex];

          // Create a new image to preload
          const tempImg = new Image();
          tempImg.onload = () => {
            // Image loaded successfully, now fade in
            preImg.src = newSrc;
            preImg.style.opacity = '1';
          };
          tempImg.src = newSrc;
        }, 150);
      });
    }

    const seeReviewsBtn = globalPreview.querySelector("#pre-see-reviews");
if (seeReviewsBtn) {
  seeReviewsBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    // Navigate to reviews.html with productId
    window.location.href = `reviews.html?id=${productId}`;
  });
}

const wishBtn = globalPreview.querySelector("#pre-add-to-wish");
if (wishBtn) {
  try {
    const wishCollectionRef = firebase.collection(userRef, "userWishs");
    const wishItemRef = firebase.doc(wishCollectionRef, productId);
    const snap = await firebase.getDoc(wishItemRef);

    if (snap.exists()) {
      // Product already in wishlist → show "unlist"
      wishBtn.textContent = "unlist";
      wishBtn.style.color = "red"; // light red
      wishBtn.style.fontSize = "15px"
    }

    wishBtn.addEventListener("click", async (e) => {
      e.stopPropagation();
      if (snap.exists()) {
        await removeFromWishs(userRef, productId);
        wishBtn.textContent = "wishlist";
        wishBtn.style.color = ""; // reset
        wishBtn.style.fontSize = "15px"
      } else {
        await addToWishs(userRef, productId);
        wishBtn.textContent = "unlist";
        wishBtn.style.color = "red";
        wishBtn.style.fontSize = "15px"
      }
    });
  } catch (err) {
    console.error("Failed to check wishlist:", err);
  }
}

    const applyColor = () => {
      try {
        const color = getDominantColor(preImg);
        globalPreview.style.backgroundColor = color;
      } catch {
        // Likely CORS taint; skip
      }
    };
    if (preImg.complete) applyColor();
    else preImg.onload = applyColor;

    globalPreview.classList.add("show");
    card.classList.add("hovering");
    activeCard = card;
  };

  const hidePreview = () => {
    globalPreview.classList.remove("show");
    if (activeCard) {
      activeCard.classList.remove("hovering");
      activeCard = null;
    }
  };

  container.querySelectorAll(".tap-sensor").forEach((card) => {
    card.addEventListener("mouseenter", () => {
      clearTimeout(hoverTimer);
      hoverTimer = setTimeout(() => {
        showPreview(card);
      }, 750);
    });

    card.addEventListener("mouseleave", (e) => {
      clearTimeout(hoverTimer);
      const to = e.relatedTarget;
      if (to && globalPreview.contains(to)) return;

      setTimeout(() => {
        if (!card.matches(":hover") && !globalPreview.matches(":hover")) {
          if (activeCard === card) hidePreview();
        }
      }, 150);
    });
  });

  globalPreview.addEventListener("mouseleave", (e) => {
    const to = e.relatedTarget;
    if (to && activeCard && activeCard.contains(to)) return;
    hidePreview();
  });
}
/* ==================== Render products ==================== */
async function renderGrid({ containerId, filterType, userRef }) {
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

    // ✅ Outer wrapper with tap-sensor and data-id
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
            <img class="add-cart-img" src="../images/icons/ic_plus_white.svg" alt="Add to cart">
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

  attachPreviewListeners(grid, userRef);
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
    await renderGrid({ containerId: "product-grid", filterType: "featured", userRef });
    await renderGrid({
      containerId: "product-grid2",
      filterType: "discounted",
      userRef,
    });

    // Wire cart clicks after render
    wireCartClicks(userRef);

    // Initial badge
    await updateCartBadge(userRef);
  } else {
    // Not signed in → render only
    await renderGrid({ containerId: "product-grid", filterType: "featured", userRef: null });
    await renderGrid({
      containerId: "product-grid2",
      filterType: "discounted",
      userRef: null,
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
    try {
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
    } catch (err) {
      console.error("Failed to load product", productId, err);
    }
  }

  document.getElementById("cart-total").textContent = `Total: $${(
    totalCents / 100
  ).toFixed(2)}`;
}

async function checkHeadline() {
  try {
    // Path: app-INFO/app-assets/headline/index.html
    const ref = firebase.doc(
      firebase.db,
      "app-INFO",       // collection
      "app-assets",     // document
      "headlines",       // subcollection
      "index.html"      // document
    );

    const snap = await firebase.getDoc(ref);

    if (snap.exists()) {
      const data = snap.data();
      if (data.available === true) {
        const headlineEl = document.getElementById("headline");
        const txtEl = document.getElementById("headline-txt");
        if (headlineEl) headlineEl.style.display = "block";
        if (txtEl) txtEl.textContent = data.headline || "";
      }
    } else {
      console.warn("No headline document found at that path");
    }
  } catch (err) {
    console.error("Error fetching headline:", err);
  }
}

checkHeadline();