// ==================================================
//                FIREBASE IMPORTS
// ==================================================
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import {getAuth,createUserWithEmailAndPassword,signInWithEmailAndPassword,onAuthStateChanged,sendPasswordResetEmail
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";
import {getFirestore,setDoc,doc,collection,getDocs
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";

// ==================================================
//                FIREBASE CONFIG
// ==================================================
const firebaseConfig = {
  apiKey: "AIzaSyDMUwhrYhjk5qK9n9A7XXcemKLy0bOGfHs",
  authDomain: "pics1word-8388a.firebaseapp.com",
  projectId: "pics1word-8388a",
  storageBucket: "pics1word-8388a.firebasestorage.app",
  messagingSenderId: "839569913930",
  appId: "1:839569913930:web:61a76cd90de9d288258eb3",
  measurementId: "G-09YM69D70E"
};

// ==================================================
//              FIREBASE INIT
// ==================================================
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// ==================================================
//                SOUND SYSTEM
// ==================================================
const Sounds = {
  click: new Audio("./config/sounds/click.mp3"),
};

Sounds.click.volume = 0.5;

function playClick() {
  const sfx = Sounds.click.cloneNode();
  sfx.play().catch(() => {});
}

// ==================================================
//                HELPERS
// ==================================================
function onPage(selector, callback) {
  if (document.querySelector(selector)) callback();
}

function navWithClick(selector, target) {
  onPage(selector, () => {
    document.querySelector(selector).addEventListener("click", () => {
      setTimeout(() => {
        window.location.href = target;
      }, 120);
    });
  });
}

// ==================================================
//                CUSTOM ALERT
// ==================================================
function customAlert(message) {
  const modal = document.getElementById("customAlert");
  const msg = document.getElementById("alertMessage");
  const ok = document.getElementById("alertOk");

  if (!modal) return alert(message);

  msg.textContent = message;
  modal.style.display = "flex";

  ok.onclick = () => {
    modal.style.display = "none";
  };
}

// ==================================================
//                AUTH LISTENER
// ==================================================
let currentUser = null;

onAuthStateChanged(auth, (user) => {
  const loginBtn = document.getElementById("loginBtn");
  const logoutBtn = document.getElementById("logoutBtn");
  const nickname = document.getElementById("nickname");

  if (user) {
    currentUser = user;
    localStorage.setItem("userId", user.uid);

    loginBtn && (loginBtn.style.display = "none");
    logoutBtn && (logoutBtn.style.display = "block");

    if (nickname) {
      nickname.textContent = user.email.split("@")[0];
      nickname.style.display = "block";
    }
  } else {
    currentUser = null;
    localStorage.removeItem("userId");

    loginBtn && (loginBtn.style.display = "block");
    logoutBtn && (logoutBtn.style.display = "none");

    if (nickname) {
      nickname.textContent = "Guest";
      nickname.style.display = "block";
    }
  }
});

// ==================================================
//                AUTH FUNCTIONS
// ==================================================
async function signupUser(email, password) {
  try {
    const { user } = await createUserWithEmailAndPassword(auth, email, password);

    await setDoc(doc(db, "users", user.uid), {
      email,
      score: 0
    });

    customAlert("Signup successful!");
    localStorage.setItem("userId", user.uid);
    document.getElementById("signupModal").style.display = "none";
  } catch (err) {
    customAlert(err.message);
  }
}

async function loginUser(email, password) {
  try {
    const { user } = await signInWithEmailAndPassword(auth, email, password);
    localStorage.setItem("userId", user.uid);

    customAlert("Login successful!");
    document.getElementById("loginModal").style.display = "none";
  } catch (err) {
    customAlert(err.message);
  }
}

// ==================================================
//            PASSWORD RESET FUNCTIONS
// ==================================================
async function sendReset(email) {
  if (!email) {
    return customAlert("Please enter your email");
  }

  try {
    await sendPasswordResetEmail(auth, email);
    customAlert("Reset link sent! Check your email.");
    forgotModal.style.display = "none";
  } catch (err) {
    customAlert(err.message);
  }
}
// ==================================================
//              LEADERBOARD
// ==================================================
const leaderboardList = document.getElementById("leaderboardList");

async function loadLeaderboard() {
  try {
    const snap = await getDocs(collection(db, "users"));
    const players = snap.docs.map(d => d.data()).sort((a, b) => b.score - a.score);

    leaderboardList.innerHTML = "";

    players.forEach((p, i) => {
      const rank = i + 1;
      leaderboardList.innerHTML += `
        <li class="leaderboard-item ${rank <= 3 ? `top-${rank}` : ""}">
          <span class="rank">#${rank}</span>
          <span class="username">${p.email.split("@")[0]}</span>
          <span class="score">${p.score}</span>
        </li>
      `;
    });
  } catch (err) {
    console.error("Leaderboard error:", err);
  }
}

leaderboardList && loadLeaderboard();

// ==================================================
//                   NAVIGATION
// ==================================================
navWithClick("#playBtn", "game.html");
navWithClick("#leaderboardBtn", "leaderboard.html");
navWithClick("#dictionaryBtn", "dictionary.html");
navWithClick("#backBtn", "index.html");

// ==================================================
//                     MODALS
// ==================================================

// open forgot-password modal
onPage("#forgotPassword", () => {
  forgotPassword.onclick = () => {
    loginModal.style.display = "none";
    forgotModal.style.display = "flex";

    // optional UX polish
    resetEmail.value = username.value.trim();
  };
});

// submit reset email
onPage("#resetSubmit", () => {
  resetSubmit.onclick = () => {
    const email = resetEmail.value.trim();
    sendReset(email);
  };
});

// close forgot modal (button)
onPage("#closeForgot", () => {
  closeForgot.onclick = () => {
    forgotModal.style.display = "none";
  };
});

// close forgot modal (click outside)
window.addEventListener("click", (e) => {
  if (e.target === forgotModal) forgotModal.style.display = "none";
});

onPage("#loginBtn", () => {
  document.getElementById("loginBtn").onclick = () =>
    document.getElementById("loginModal").style.display = "flex";
});

onPage("#showSignup", () => {
  showSignup.onclick = () => {
    loginModal.style.display = "none";
    signupModal.style.display = "flex";
  };
});

onPage("#closeModal", () => {
  closeModal.onclick = () => loginModal.style.display = "none";
});

onPage("#closeSignup", () => {
  closeSignup.onclick = () => signupModal.style.display = "none";
});

window.addEventListener("click", (e) => {
  if (e.target === loginModal) loginModal.style.display = "none";
  if (e.target === signupModal) signupModal.style.display = "none";
});

// ==================================================
//              FORM SUBMITS
// ==================================================
onPage("#signupSubmit", () => {
  signupSubmit.onclick = () => {
    const email = signupEmail.value.trim();
    const pass = signupPassword.value.trim();
    const confirm = confirmPassword.value.trim();

    if (!email || !pass || !confirm)
      return customAlert("Fill out all fields");

    if (pass !== confirm)
      return customAlert("Passwords do not match");

    signupUser(email, pass);
  };
});

onPage("#loginSubmit", () => {
  loginSubmit.onclick = () => {
    const email = username.value.trim();
    const pass = password.value.trim();

    if (!email || !pass)
      return customAlert("Enter email and password");

    loginUser(email, pass);
  };
});

// ==================================================
//              LOGOUT
// ==================================================
onPage("#logoutBtn", () => {
  logoutBtn.onclick = async () => {
    playClick();
    await auth.signOut();
    localStorage.removeItem("userId");
    window.location.href = "index.html";
  };
});

// ==================================================
//        GLOBAL BUTTON CLICK SOUND
// ==================================================
document.querySelectorAll("button").forEach(btn => {
  btn.addEventListener("click", playClick);
});
