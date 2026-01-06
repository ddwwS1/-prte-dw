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

/* ==================== Auth state listener ==================== */
firebase.onAuthStateChanged(firebase.auth, async (user) => {
  if (user) {
    console.log("User signed in:", user.displayName || user.email);

    const heading = document.getElementById("username");
    if (heading) heading.textContent = user.displayName || user.email;

    const googlebtntxt = document.getElementById("sgn-w-google-txt");
    if (googlebtntxt) googlebtntxt.textContent = "Change Google Account";

    const profilePicHolder = document.getElementById("profile-pic-holder");
    const profilePic = document.getElementById("profile-pic");
    if (profilePicHolder && profilePic) {
      if (user.photoURL) {
        profilePic.style.backgroundImage = `url(${user.photoURL})`;
        profilePicHolder.style.display = "block";
      } else {
        profilePicHolder.style.display = "none";
      }
    }

    try {
      const userRef = firebase.doc(firebase.db, "users", user.uid);
      const snap = await firebase.getDoc(userRef);

      if (snap.exists()) {
        const data = snap.data();
        console.log("User doc found:", data);

        if (!data.address || !data.phoneNumber) {
          await firebase.setDoc(
            userRef,
            {
              address: data.address || "123 Main Street, Konya, Türkiye",
              phoneNumber: data.phoneNumber || "+90 555 123 4567",
            },
            { merge: true }
          );
        }

        console.log("User doc data:", data);
        updateInfoSection(data);

        // Adjust positions when signed in
        const profileCard = document.getElementById("profile-card");
        const shCard = document.getElementById("sh-card");
        const magCard = document.getElementById("mag-card");
        if (profileCard) profileCard.style.display = "block";
        if (shCard) shCard.style.right = "75px";
        if (magCard) magCard.style.right = "135px";

        // Load and display profile image with dynamic outline
        const profileImgMenu = document.getElementById("profile-img-menu");
        if (profileImgMenu) {
          console.log("Setting profile img src to:", data.image);
          
          // Function to apply outline based on image average color
          const applyOutline = () => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            canvas.width = profileImgMenu.naturalWidth;
            canvas.height = profileImgMenu.naturalHeight;
            try {
              ctx.drawImage(profileImgMenu, 0, 0);
              const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
              const imgData = imageData.data; // RGBA pixel data
              let r = 0, g = 0, b = 0, count = 0;
              // Sum RGB values from all pixels
              for (let i = 0; i < imgData.length; i += 4) {
                r += imgData[i];     // Red
                g += imgData[i + 1]; // Green
                b += imgData[i + 2]; // Blue
                count++;
              }
              // Calculate average color
              r = Math.floor(r / count);
              g = Math.floor(g / count);
              b = Math.floor(b / count);
              console.log(`Outline color: rgb(${r}, ${g}, ${b})`);
              // Apply semi-transparent outline using average color
              if (profileCard) profileCard.style.boxShadow = `0 0 0 3px rgba(${r}, ${g}, ${b}, 0.7)`;
            } catch (e) {
              console.log('CORS or other error extracting color, using default outline');
              // Fallback to semi-transparent black outline
              if (profileCard) profileCard.style.boxShadow = '0 0 0 3px rgba(0, 0, 0, 0.7)';
            }
          };

          // Set cross-origin for external images and load src
          profileImgMenu.crossOrigin = 'anonymous';
          profileImgMenu.src = data.image || "../images/icons/ic_user_white.png";
          profileImgMenu.style.display = "block";

          // Apply outline immediately if image is cached, else on load
          if (profileImgMenu.complete) {
            applyOutline();
          } else {
            profileImgMenu.onload = applyOutline;
          }
        }
      } else {
        const newData = {
          name: user.displayName || "",
          email: user.email || "",
          image: user.photoURL || "",
          createdAt: new Date().toISOString(),
          address: "",
          phoneNumber: "",
        };
        await firebase.setDoc(userRef, newData);
        updateInfoSection(newData);
      }
    } catch (e) {
      console.error("Failed to save user data:", e);
    }
  } else {
    // User signed out: hide profile and reset positions and outline
    const profileImgMenu = document.getElementById("profile-img-menu");
    if (profileImgMenu) {
      profileImgMenu.style.display = "none";
    }

    // Adjust positions when signed out
    const profileCard = document.getElementById("profile-card");
    const shCard = document.getElementById("sh-card");
    const magCard = document.getElementById("mag-card");
    if (profileCard) {
      profileCard.style.display = "none";
      profileCard.style.boxShadow = "none"; // Remove outline
    }
    if (shCard) shCard.style.right = "15px";
    if (magCard) magCard.style.right = "75px";
  }
});

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