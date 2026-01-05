import * as firebase from "./firebase.js";

async function loadReviews() {
  const container = firebase.document.getElementById("reviews-container");
  container.innerHTML = "<p>Loading reviews...</p>";

  try {
    const querySnap = await firebase.getDocs(firebase.collection(db, "reviews"));
    container.innerHTML = "";

    querySnap.forEach((doc) => {
      const review = doc.data();
      const reviewEl = document.createElement("div");
      reviewEl.className = "review-card";
      reviewEl.innerHTML = `
        <h3>${review.productName}</h3>
        <div class="stars">${"★".repeat(review.rating)}${"☆".repeat(5 - review.rating)}</div>
        <p>${review.comment}</p>
        <small>by ${review.user || "Anonymous"} on ${review.date?.toDate().toLocaleDateString()}</small>
      `;
      container.appendChild(reviewEl);
    });
  } catch (err) {
    container.innerHTML = "<p>Failed to load reviews.</p>";
    console.error(err);
  }
}

loadReviews();