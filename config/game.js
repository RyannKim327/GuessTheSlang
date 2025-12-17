// =======================
//        IMPORTS
// =======================
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";
import {getFirestore,collection,getDocs,doc,getDoc,updateDoc} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";

// =======================
//     FIREBASE CONFIG
// =======================
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
const db = getFirestore(app);

// =======================
//        DOM CACHE
// =======================
const $ = (id) => document.getElementById(id);

const backBtn     = $("backBtn");
const answerBoxes = $("answerBoxes");
const letterBank  = $("letterBank");
const shuffleBtn  = $("shuffleBtn");
const checkBtn    = $("checkBtn");
const nextBtn     = $("nextBtn");
const hintBtn     = $("hintBtn");
const resetBtn    = $("resetLvls");

// =======================
//        SOUND FX
// =======================
const clickSfx = new Audio("./config/sounds/click.mp3");
clickSfx.volume = 0.5;

// unlock audio (mobile fix)
document.addEventListener("pointerdown", () => {
  clickSfx.play().then(() => {
    clickSfx.pause();
    clickSfx.currentTime = 0;
  }).catch(() => {});
}, { once: true });

function playClick() {
  const sfx = clickSfx.cloneNode();
  sfx.playbackRate = 0.95 + Math.random() * 0.1;
  sfx.play().catch(() => {});
}

// global click handler
document.addEventListener("click", (e) => {
  if (
    e.target.closest("button") ||
    e.target.classList.contains("letter-tile") ||
    e.target.classList.contains("answer-box")
  ) {
    playClick();
  }
});

// =======================
//        UTILITIES
// =======================
function customAlert(message) {
  const modal = $("customAlert");
  const text  = $("alertMessage");
  const ok    = $("alertOk");

  if (!modal || !text || !ok) {
    alert(message);
    return;
  }

  text.textContent = message;
  modal.style.display = "flex";
  ok.onclick = () => modal.style.display = "none";
}

function cleanURL(url = "") {
  return url.replace(/^"+|"+$/g, "").trim();
}

// =======================
//        SCORE
// =======================
async function getUserRef() {
  const uid = localStorage.getItem("userId");
  if (!uid || uid === "guest") return null;
  return doc(db, "users", uid);
}

async function addScore(points) {
  const ref = await getUserRef();
  if (!ref) return;
  const snap = await getDoc(ref);
  if (!snap.exists()) return;
  await updateDoc(ref, { score: (snap.data().score || 0) + points });
}

async function deductScore(points) {
  const ref = await getUserRef();
  if (!ref) return false;
  const snap = await getDoc(ref);
  if (!snap.exists()) return false;
  const score = snap.data().score || 0;
  if (score < points) return false;
  await updateDoc(ref, { score: score - points });
  return true;
}

// =======================
//        GAME STATE
// =======================
let levels = [];
let currentLevel = Number(localStorage.getItem("currentLevel")) || 0;

function safeLevel() {
  return levels[currentLevel] || null;
}

function setUI(enabled) {
  [hintBtn, shuffleBtn, checkBtn, nextBtn].forEach(b => b && (b.disabled = !enabled));
}

setUI(false);

// =======================
//        LEVEL LOAD
// =======================
async function fetchLevels() {
  try {
    const snap = await getDocs(collection(db, "levels"));
    levels = snap.docs.sort((a, b) => a.id.localeCompare(b.id)).map(d => d.data());

    if (!levels.length) return customAlert("No levels found");

    currentLevel = Math.min(currentLevel, levels.length - 1);
    localStorage.setItem("currentLevel", currentLevel);

    loadLevel();
    setUI(true);
  } catch (e) {
    console.error(e);
    customAlert("Failed to load levels");
  }
}

function loadLevel() {
  const level = safeLevel();
  if (!level) return;

  $("current_level").textContent = `Level: ${currentLevel + 1}`;

  ["img1","img2","img3","img4"].forEach((id, i) => {
    const img = $(id);
    if (img) img.src = cleanURL(level.images?.[i]);
  });

  nextBtn.style.display = "none";
  checkBtn.style.display = "inline-block";

  buildAnswerBoxes(level.answer);
  buildLetterTiles(level.answer);
}

// =======================
//        ANSWER BOXES
// =======================
function buildAnswerBoxes(answer = "") {
  answerBoxes.innerHTML = "";

  [...answer].forEach((_, i) => {
    const box = document.createElement("div");
    box.className = "answer-box";
    box.dataset.index = i;
    box.onclick = () => box.textContent && clearBox(i);
    answerBoxes.appendChild(box);
  });
}

function findEmptyBox() {
  return [...answerBoxes.children].find(b => !b.textContent)?.dataset.index ?? -1;
}

function clearBox(i) {
  const box = answerBoxes.children[i];
  const tileId = box.dataset.srcTile;
  box.textContent = "";
  delete box.dataset.srcTile;

  if (!tileId) return;
  const tile = letterBank.querySelector(`[data-tile-id='${tileId}']`);
  if (tile) tile.style.visibility = "";
}

// =======================
//        LETTER TILES
// =======================
function buildLetterTiles(answer = "") {
  letterBank.innerHTML = "";

  const needed = {};
  [...answer.toUpperCase()].forEach(l => needed[l] = (needed[l] || 0) + 1);

  let letters = Object.entries(needed).flatMap(([l, c]) => Array(c).fill(l));
  while (letters.length < 12) letters.push(String.fromCharCode(65 + Math.random() * 26));
  letters.sort(() => Math.random() - 0.5);

  const uid = Date.now();

  letters.forEach((l, i) => {
    const tile = document.createElement("div");
    tile.className = "letter-tile";
    tile.textContent = l;
    tile.dataset.tileId = `${uid}-${i}`;

    tile.onclick = () => {
      if (tile.style.visibility === "hidden") return;
      const idx = findEmptyBox();
      if (idx === -1) return;

      const box = answerBoxes.children[idx];
      box.textContent = l;
      box.dataset.srcTile = tile.dataset.tileId;
      tile.style.visibility = "hidden";
    };

    letterBank.appendChild(tile);
  });
}

// =======================
//        ACTIONS
// =======================
checkBtn.onclick = () => {
  const level = safeLevel();
  if (!level) return;

  const answer = [...answerBoxes.children].map(b => b.textContent).join("");
  if (answer === level.answer) {
    customAlert("Correct! 🎉");
    addScore(10);
    nextBtn.style.display = "inline-block";
    checkBtn.style.display = "none";
  } else {
    customAlert("Try again 😅");
  }
};

nextBtn.onclick = () => {
  currentLevel++;
  localStorage.setItem("currentLevel", currentLevel);
  currentLevel >= levels.length ? customAlert("All levels done!") : loadLevel();
};

shuffleBtn.onclick = () => {
  [...letterBank.children].sort(() => Math.random() - 0.5)
    .forEach(t => letterBank.appendChild(t));
};

hintBtn.onclick = async () => {
  if (!(await deductScore(10))) return customAlert("Not enough points!");

  const level = safeLevel();
  const correct = level.answer.toUpperCase();

  [...answerBoxes.children].some((b, i) => {
    if (b.textContent !== correct[i]) {
      if (b.textContent) clearBox(i);
      b.textContent = correct[i];
      return true;
    }
  });
};

resetBtn.onclick = () => {
  currentLevel = 0;
  localStorage.setItem("currentLevel", 0);
  fetchLevels();
  customAlert("Progress reset");
};

backBtn.onclick = () => {
  setTimeout(() => location.href = "index.html", 150);
};

// =======================
//        START
// =======================
fetchLevels();