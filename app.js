const playBtn = document.getElementById("playBtn");
const loginBtn = document.getElementById("loginBtn");
const loginModal = document.getElementById("loginModal");
const signupModal = document.getElementById("signupModal");
const closeModal = document.getElementById("closeModal");
const closeSignup = document.getElementById("closeSignup");
const showSignup = document.getElementById("showSignup");

// For now, just check if there's a "logged in" user (we’ll connect this to Firebase later)
let currentUser = localStorage.getItem("userId");

// Play button logic
playBtn.addEventListener("click", () => {
  if (currentUser) {
    window.location.href = "game.html";
  } else {
    loginModal.style.display = "block";
  }
});

// Show login
loginBtn.addEventListener("click", () => {
  loginModal.style.display = "block";
});

// Switch to signup
showSignup.addEventListener("click", () => {
  loginModal.style.display = "none";
  signupModal.style.display = "block";
});

// Close modals
closeModal.addEventListener("click", () => (loginModal.style.display = "none"));
closeSignup.addEventListener("click", () => (signupModal.style.display = "none"));

// Close when clicking outside the modal
window.addEventListener("click", (e) => {
  if (e.target === loginModal) loginModal.style.display = "none";
  if (e.target === signupModal) signupModal.style.display = "none";
});

const signupSubmit = document.getElementById("signupSubmit");

signupSubmit.addEventListener("click", () => {
  const email = document.getElementById("signupEmail").value.trim();
  const password = document.getElementById("signupPassword").value.trim();
  const confirmPassword = document.getElementById("confirmPassword").value.trim();

  if (!email || !password || !confirmPassword) {
    alert("Please fill out all fields!");
    return;
  }

  if (password !== confirmPassword) {
    alert("Passwords do not match!");
    return;
  }

  // If everything is valid, proceed with Firebase signup
  signupUser(email, password);
});
