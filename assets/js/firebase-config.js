// Firebase Configuration
const firebaseConfig = {
    apiKey: "AIzaSyCIwe9SVx9oaVU7DI8xXmcSiNyBixjUCAY",
    authDomain: "vocabatlas.firebaseapp.com",
    projectId: "vocabatlas",
    storageBucket: "vocabatlas.firebasestorage.app",
    messagingSenderId: "396301996754",
    appId: "1:396301996754:web:63192e390b10ea3fc1d30b",
    measurementId: "G-T6JLGP3GWQ"
};

// Initialize Firebase
if (typeof firebase !== 'undefined') {
    firebase.initializeApp(firebaseConfig);
    // Initialize Analytics if available
    if (firebase.analytics) {
        firebase.analytics();
    }
    console.log("Firebase Initialized");
} else {
    console.error("Firebase SDK not loaded");
}
