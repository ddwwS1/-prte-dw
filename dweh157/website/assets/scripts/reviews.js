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
  loadProductCard();
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

async function loadProductCard() {
  const container = document.getElementById('product-card');
  if (!container) return;

  let imgSrc; // Declare imgSrc at function scope

  try {
    const productSnap = await firebase.getDoc(firebase.doc(firebase.db, 'products', productId));
    if (!productSnap.exists()) {
      container.innerHTML = '<p>Product not found.</p>';
      return;
    }
    const product = productSnap.data();

    // Fetch seller name
    let sellerName = "Unknown";
    let sellerImage = "../images/brand_icons/ic_google_brand.png"; // Default logo
    if (product?.sellerID) {
      try {
        const sellerSnap = await firebase.getDoc(firebase.doc(firebase.db, "users", product.sellerID));
        if (sellerSnap.exists()) {
          const sellerData = sellerSnap.data();
          sellerName = sellerData.name || "Unknown";
          sellerImage = sellerData.image || "../images/brand_icons/ic_google_brand.png";
        }
      } catch (err) {
        console.error("Failed to fetch seller:", err);
      }
    }

    // Fetch reviews for graph
    const reviewsSnap = await firebase.getDocs(firebase.collection(firebase.db, 'products', productId, 'product-reviews'));
    const reviews = [];
    reviewsSnap.forEach(doc => reviews.push(doc.data()));

    // Group by month
    const monthlyRatings = {};
    reviews.forEach(review => {
      if (review.timestamp) {
        const date = review.timestamp.toDate();
        const month = date.toLocaleString('default', { month: 'short' });
        if (!monthlyRatings[month]) monthlyRatings[month] = [];
        monthlyRatings[month].push(review.stars);
      }
    });

    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const graphData = months.map(month => {
      const ratings = monthlyRatings[month] || [];
      const avg = ratings.length ? (ratings.reduce((a,b)=>a+b,0) / ratings.length).toFixed(1) : 0;
      return { month, avg: parseFloat(avg) };
    });

    const priceCents = Number(product.price) || 0;
    let imgSrc = product.image;
    if (imgSrc && imgSrc.includes('github.com') && imgSrc.includes('products-img')) {
      const filename = imgSrc.split('/').pop().split('?')[0];
      imgSrc = '../images/products-img/' + filename;
    } else if (!imgSrc) {
      imgSrc = 'https://via.placeholder.com/200x200?text=No+Image';
    }
    const description = product.description || 'No description available.';

    container.innerHTML = `
      <div class="product-overview-card">
        <div class="product-image">
          <img src="${imgSrc}" alt="${product.name}">
        </div>
        <div class="product-details">
          <h2 class="product-name">${product.name || 'Unnamed Product'}</h2>
          <p class="product-price">$${(priceCents / 100).toFixed(2)}</p>
          <p class="product-description">${description}</p>
          <div class="seller-info">
            <img src="${sellerImage}" alt="Seller Logo" class="seller-logo">
            <span class="seller-name">${sellerName}</span>
          </div>
        </div>
        <div class="ratings-graph">
          <h3>Monthly Ratings</h3>
          <div class="graph-container">
            ${graphData.map(data => `
              <div class="graph-bar" style="--height: ${data.avg * 20}px;">
                <span class="bar-value">${data.avg}</span>
                <span class="bar-label">${data.month}</span>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    `;
  } catch (error) {
    container.innerHTML = '<p>Failed to load product.</p>';
    console.error('Error loading product card:', error);
  }

  // Load and display product image with dynamic outline
  const productImg = container.querySelector('.product-image img');
  if (productImg) {
    console.log("Setting product img src to:", imgSrc);
    
    // Function to apply outline based on image average color
    const applyOutline = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      canvas.width = productImg.naturalWidth;
      canvas.height = productImg.naturalHeight;
      try {
        ctx.drawImage(productImg, 0, 0);
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
        console.log(`Product outline color: rgb(${r}, ${g}, ${b})`);
        // Apply semi-transparent outline using average color
        productImg.style.boxShadow = `0 0 20px 3px rgba(${r}, ${g}, ${b}, 0.7)`;
        productImg.style.transition = 'box-shadow 0.3s ease';
      } catch (e) {
        console.log('Error extracting color, using default outline');
        // Fallback to semi-transparent black outline
        productImg.style.boxShadow = '0 0 20px 3px rgba(0, 0, 0, 0.7)';
        productImg.style.transition = 'box-shadow 0.3s ease';
      }
    };

    // Apply outline immediately if already loaded
    if (productImg.complete) {
      applyOutline();
    } else {
      productImg.onload = applyOutline;
    }
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