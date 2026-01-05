const admin = require('firebase-admin');

// Initialize Firebase Admin
// For local emulator
if (process.env.FIRESTORE_EMULATOR_HOST) {
  admin.initializeApp({
    projectId: 'prte-dw'
  });
} else {
  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
    databaseURL: 'https://prte-dw-default-rtdb.europe-west1.firebasedatabase.app',
    projectId: 'prte-dw'
  });
}

const db = admin.firestore();

// Sample reviews data
const sampleReviews = [
  {
    productId: 'sample-product-1', // Replace with actual product IDs
    productName: 'Sample Product 1',
    rating: 5,
    comment: 'Amazing product! Highly recommend.',
    user: 'user123',
    date: admin.firestore.Timestamp.now()
  },
  {
    productId: 'sample-product-1',
    productName: 'Sample Product 1',
    rating: 4,
    comment: 'Good quality, but a bit pricey.',
    user: 'user456',
    date: admin.firestore.Timestamp.now()
  },
  {
    productId: 'sample-product-2',
    productName: 'Sample Product 2',
    rating: 3,
    comment: 'It\'s okay, nothing special.',
    user: 'user789',
    date: admin.firestore.Timestamp.now()
  },
  {
    productId: 'sample-product-2',
    productName: 'Sample Product 2',
    rating: 5,
    comment: 'Love it! Will buy again.',
    user: 'user101',
    date: admin.firestore.Timestamp.now()
  },
  {
    productId: 'sample-product-3',
    productName: 'Sample Product 3',
    rating: 2,
    comment: 'Not what I expected.',
    user: 'user202',
    date: admin.firestore.Timestamp.now()
  }
];

async function addReviews() {
  const batch = db.batch();

  for (const review of sampleReviews) {
    const productRef = db.collection('products').doc(review.productId);
    const reviewRef = productRef.collection('reviews').doc();
    batch.set(reviewRef, {
      rating: review.rating,
      comment: review.comment,
      user: review.user,
      date: admin.firestore.Timestamp.now()
    });
  }

  try {
    await batch.commit();
    console.log('Reviews added successfully!');
  } catch (error) {
    console.error('Error adding reviews:', error);
  }
}

addReviews();