import * as firebase from "./firebase.js";

// Get product ID from URL
const urlParams = new URLSearchParams(window.location.search);
const productId = urlParams.get('id') || 'default'; // Fallback for testing

let currentUser = null;
let selectedStars = 0;

// Auth state listener
firebase.onAuthStateChanged(firebase.auth, (user) => {
  currentUser = user;
  const postSection = document.getElementById('review-post-section');
  if (user) {
    postSection.style.display = 'block';
  } else {
    postSection.style.display = 'none';
  }
  loadReviews();
});

// Star rating functionality
document.addEventListener('DOMContentLoaded', () => {
  const stars = document.querySelectorAll('.star');
  stars.forEach(star => {
    star.addEventListener('click', () => {
      selectedStars = parseInt(star.dataset.value);
      updateStarDisplay();
    });
  });

  // Post review button
  const postBtn = document.getElementById('post-review-btn');
  if (postBtn) {
    postBtn.addEventListener('click', postReview);
  }
});

function updateStarDisplay() {
  const stars = document.querySelectorAll('.star');
  stars.forEach((star, index) => {
    if (index < selectedStars) {
      star.textContent = '★';
      star.classList.add('selected');
    } else {
      star.textContent = '☆';
      star.classList.remove('selected');
    }
  });
}

async function postReview() {
  if (!currentUser) {
    alert('Please sign in to post a review.');
    return;
  }

  const reviewText = document.getElementById('review-text').value.trim();
  if (!reviewText || selectedStars === 0) {
    alert('Please enter review text and select a star rating.');
    return;
  }

  try {
    // Get current user data to store in review
    const userRef = firebase.doc(firebase.db, 'users', currentUser.uid);
    const userSnap = await firebase.getDoc(userRef);
    const userData = userSnap.exists() ? userSnap.data() : {};

    await firebase.addDoc(firebase.collection(firebase.db, 'products', productId, 'product-reviews'), {
      authorId: currentUser.uid,
      authorName: userData.name || currentUser.displayName || currentUser.email || 'Anonymous',
      authorImage: userData.image || currentUser.photoURL || null,
      text: reviewText,
      stars: selectedStars,
      timestamp: firebase.serverTimestamp()
    });

    // Clear form
    document.getElementById('review-text').value = '';
    selectedStars = 0;
    updateStarDisplay();

    // Reload reviews
    loadReviews();
  } catch (error) {
    console.error('Error posting review:', error);
    alert('Failed to post review. Please try again.');
  }
}

async function loadReviews() {
  const container = document.getElementById('reviews-container');
  if (!container) return;

  container.innerHTML = '<p>Loading reviews...</p>';

  try {
    const querySnap = await firebase.getDocs(firebase.collection(firebase.db, 'products', productId, 'product-reviews'));
    container.innerHTML = '';

    if (querySnap.empty) {
      container.innerHTML = '<p>No reviews yet. Be the first to review!</p>';
      return;
    }

    const reviews = [];
    querySnap.forEach((doc) => {
      reviews.push({ id: doc.id, ...doc.data() });
    });

    // Sort by timestamp descending
    reviews.sort((a, b) => b.timestamp?.toDate() - a.timestamp?.toDate());

    for (const review of reviews) {
      await renderReview(review);
    }
  } catch (error) {
    container.innerHTML = '<p>Failed to load reviews.</p>';
    console.error('Error loading reviews:', error);
  }
}

async function renderReview(review) {
  try {
    const reviewEl = document.createElement('div');
    reviewEl.className = 'review-card';

    const timestamp = review.timestamp?.toDate().toLocaleDateString() || 'Unknown date';
    const starsDisplay = '★'.repeat(review.stars) + '☆'.repeat(5 - review.stars);

    reviewEl.innerHTML = `
      <div class="review-header">
        <div class="user-info">
          <img src="${review.authorImage || '../images/icons/ic_user_white.png'}" alt="Profile" class="profile-pic">
          <div class="user-details">
            <span class="username">${review.authorName || 'Anonymous'}</span>
            <span class="timestamp">${timestamp}</span>
          </div>
        </div>
        <div class="review-actions">
          ${currentUser && currentUser.uid === review.authorId ? `
            <div class="extend-icon" onclick="toggleReviewActions('${review.id}')">⋯</div>
            <div id="actions-${review.id}" class="review-actions-menu">
              <button onclick="deleteReview('${review.id}')" class="delete-btn">Delete</button>
            </div>
          ` : ''}
        </div>
      </div>
      <div class="stars">${starsDisplay}</div>
      <p class="review-text">${review.text}</p>
    `;

    document.getElementById('reviews-container').appendChild(reviewEl);
  } catch (error) {
    console.error('Error rendering review:', error);
  }
}

// Global functions for onclick
window.toggleReviewActions = function(reviewId) {
  const actionsMenu = document.getElementById(`actions-${reviewId}`);
  if (actionsMenu) {
    actionsMenu.classList.toggle('show');
  }
};

window.deleteReview = async function(reviewId) {
  try {
    await firebase.deleteDoc(firebase.doc(firebase.db, 'products', productId, 'product-reviews', reviewId));
    loadReviews();
  } catch (error) {
    console.error('Error deleting review:', error);
    alert('Failed to delete review.');
  }
};