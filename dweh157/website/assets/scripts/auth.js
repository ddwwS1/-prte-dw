// script.js
import * as firebase from "./firebase.js";

/* ==================== Helper: update DOM info section ==================== */
function updateInfoSection(data) {
  const emailTxt = document.getElementById("email-txt");
  const phoneTxt = document.getElementById("phonenum-txt");
  const addressTxt = document.getElementById("address-txt");

  if (emailTxt) emailTxt.textContent = "Gmail : " + (data.email || "none");
  if (phoneTxt) phoneTxt.textContent = "Phone number : " + (data.phoneNumber || "none");
  if (addressTxt) addressTxt.textContent = "Address : " + (data.address || "none");
}


/* ==================== Sign-in button ==================== */
const signInBtn = document.getElementById("sgn-w-google-btn");
if (signInBtn) {
  signInBtn.addEventListener("click", async () => {
    try {
      console.log("Attempting sign-in with popup; origin:", location.origin);
      const result = await firebase.signInWithPopup(firebase.auth, firebase.provider);
      const user = result.user;
      console.log("Sign-in successful:", user.displayName || user.email);

      const userRef = firebase.doc(firebase.db, "users", user.uid);
      await firebase.setDoc(
        userRef,
        {
          name: user.displayName || "",
          email: user.email || "",
          image: user.photoURL || "",
          createdAt: new Date().toISOString(),
          address: "",
          phoneNumber: "",
        },
        { merge: true }
      );

      // Settings subcollection
      const settingsRef = firebase.collection(userRef, "settings");
      await firebase.setDoc(firebase.doc(settingsRef, "preferences"), {
        theme: "light",
        notifications: true,
      });

      // Cart subcollection
      const ordersRef = firebase.collection(userRef, "userCart");
      await firebase.addDoc(ordersRef, {
        createdAt: new Date().toISOString(),
        items: [],
      });

      // wishlist subcollection
      const wishRef = firebase.collection(userRef, "userWishs");
      await firebase.addDoc(wishRef, {
        createdAt: new Date().toISOString(),
        items: [],
      });

      // Payment methods subcollection
      const payRef = firebase.collection(userRef, "paymentMethods");
      await firebase.setDoc(firebase.doc(payRef, "default"), {
        type: "empty",
        provider: "empty",
        last4: "0000",
        expiryMonth: 0,
        expiryYear: 0,
        billingAddress: {
          street: "unknown",
          city: "unknown",
          postalCode: "00000",
          country: "unknown",
        },
      });

      // Order history subcollection
      const orderhisRef = firebase.collection(userRef, "orderhis");
      await firebase.setDoc(firebase.doc(orderhisRef, "all"), {
        items: [],
        totalAmount: 0,
        orderDate: "unknown",
      });

      console.log("User doc and subcollections created successfully");
    } catch (err) {
      console.error("Sign-in failed:", err);
      alert("Sign-in failed: " + (err?.message || err));
    }
  });
} else {
  console.error("Sign-in button with id 'sgn-w-google-btn' not found in the DOM.");
}

/* ==================== Menu buttons ==================== */
function showPage(pageId) {
  ["page-1", "page-2", "page-3", "page-4"].forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.style.display = id === pageId ? "block" : "none";
  });
}

document.getElementById("my-info-btn")?.addEventListener("click", () => showPage("page-1"));
document.getElementById("my-address-btn")?.addEventListener("click", () => showPage("page-2"));
document.getElementById("payment-methods-btn")?.addEventListener("click", () => showPage("page-3"));
document.getElementById("order-history-btn")?.addEventListener("click", () => showPage("page-4"));

/* ==================== Sign out button ==================== */
document.getElementById("sign-out-btn")?.addEventListener("click", async () => {
  try {
    await firebase.signOut(firebase.auth);
    console.log("User signed out successfully");
    window.location.href = "index.html";
  } catch (error) {
    console.error("Error signing out:", error);
  }
});