import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyDMUwhrYhjk5qK9n9A7XXcemKLy0bOGfHs",
  authDomain: "pics1word-8388a.firebaseapp.com",
  projectId: "pics1word-8388a",
  storageBucket: "pics1word-8388a.firebasestorage.app",
  messagingSenderId: "839569913930",
  appId: "1:839569913930:web:61a76cd90de9d288258eb3",
  measurementId: "G-09YM69D70E"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

const loading = document.getElementById("loading");
const content = document.getElementById("content");
const logoutBtn = document.getElementById("logoutBtn");

// Auth guard
onAuthStateChanged(auth, user => {
  if (!user) {
    window.location.href = "index.html";
  } else {
    console.log("✅ Logged in as:", user.email);
    loading.style.display = "none";
    content.style.display = "block";
  }
});

// Logout
logoutBtn.addEventListener("click", async () => {
  await signOut(auth);
  alert("You have been logged out!");
  window.location.href = "index.html";
});
