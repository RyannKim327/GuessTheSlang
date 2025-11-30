// --- Firebase imports ---
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";
import { getFirestore, collection, getDocs, doc, getDoc, updateDoc } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";

// --- FIREBASE CONFIG ---
const firebaseConfig = {
  apiKey: "AIzaSyDMUwhrYhjk5qK9n9A7XXcemKLy0bOGfHs",
  authDomain: "pics1word-8388a.firebaseapp.com",
  projectId: "pics1word-8388a",
  storageBucket: "pics1word-8388a.firebasestorage.app",
  messagingSenderId: "839569913930",
  appId: "1:839569913930:web:61a76cd90de9d288258eb3",
  measurementId: "G-09YM69D70E"
};

// --- INIT FIREBASE ---
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// --- DOM ---
const backBtn     = document.getElementById("backBtn");
const answerBoxes = document.getElementById("answerBoxes");
const letterBank  = document.getElementById("letterBank");
const shuffleBtn  = document.getElementById("shuffleBtn");
const checkBtn    = document.getElementById("checkBtn");
const nextBtn     = document.getElementById("nextBtn");

// --- BACK BUTTON ---
if (backBtn) {
  backBtn.addEventListener("click", () => {
    window.location.href = "index.html";
  });
}

// --- CUSTOM ALERT ---
function customAlert(message) {
  const alertModal = document.getElementById("customAlert");
  const alertMsg = document.getElementById("alertMessage");
  const alertOk = document.getElementById("alertOk");

  alertMsg.textContent = message;
  alertModal.style.display = "flex";

  alertOk.onclick = () => {
    alertModal.style.display = "none";
  };
}

// =======================
//       SCORE UPDATE
// =======================
async function addScore(points) {
  const userId = localStorage.getItem("userId");
  if (!userId || userId === "guest") return;

  const userRef = doc(db, "users", userId);
  const snap = await getDoc(userRef);

  if (!snap.exists()) return;

  const currentScore = snap.data().score || 0;
  await updateDoc(userRef, { score: currentScore + points });
}

// =======================
//      GLOBALS
// =======================
let levels = [];
let currentLevel = 0;

// =======================
//     FETCH LEVELS
// =======================
async function fetchLevels() {
  const snap = await getDocs(collection(db, "levels"));
  levels = snap.docs.map(doc => doc.data());
  loadLevel();
}

function cleanURL(url) {
  if (!url) return "";
  return url.replace(/^"+|"+$/g, "").trim();
}

// =======================
//     LOAD LEVEL
// =======================
function loadLevel() {
  const level = levels[currentLevel];

  document.getElementById("current_level").textContent = `Level: ${currentLevel + 1}`;
  document.getElementById("img1").src = cleanURL(level.images[0]);
  document.getElementById("img2").src = cleanURL(level.images[1]);
  document.getElementById("img3").src = cleanURL(level.images[2]);
  document.getElementById("img4").src = cleanURL(level.images[3]);

  nextBtn.style.display = "none";
  checkBtn.style.display = "inline-block";

  generateAnswerBoxes(level.answer);
  generateLetterTiles(level.answer);
}

// =======================
//    ANSWER BOXES UI
// =======================
function generateAnswerBoxes(answer) {
  answerBoxes.innerHTML = "";

  const len = answer.length;
  for (let i = 0; i < len; i++) {
    const box = document.createElement("div");
    box.classList.add("answer-box");
    box.dataset.index = i;            // identify box
    box.textContent = "";
    // clicking a filled box will deselect / restore tile
    box.addEventListener("click", () => {
      if (box.textContent === "") return;
      clearBox(parseInt(box.dataset.index, 10));
    });
    answerBoxes.appendChild(box);
  }
}

// =======================
//     LETTER TILES UI
// =======================
function generateLetterTiles(answer) {
  letterBank.innerHTML = "";

  // 1) Count required letters (respect frequency) from answer
  const required = {};
  [...answer.toUpperCase()].forEach(ch => {
    required[ch] = (required[ch] || 0) + 1;
  });

  // 2) Build initial array that includes all required letters
  let letters = [];
  Object.entries(required).forEach(([ch, count]) => {
    for (let i = 0; i < count; i++) letters.push(ch);
  });

  // 3) Fill remaining slots up to 12 with random letters (A-Z)
  while (letters.length < 12) {
    letters.push(String.fromCharCode(65 + Math.floor(Math.random() * 26)));
  }

  // 4) Shuffle the letters array
  letters.sort(() => Math.random() - 0.5);

  // 5) Create tiles with stable ids so we can restore them later
  letters.forEach((letter, i) => {
    const tile = document.createElement("div");
    tile.classList.add("letter-tile");
    tile.textContent = letter;
    tile.dataset.tileId = `tile-${i}`;   // stable id
    tile.dataset.visible = "true";

    tile.addEventListener("click", () => {
      // ignore clicks on hidden tiles
      if (tile.style.visibility === "hidden") return;

      const nextIndex = findNextEmptyBoxIndex();
      if (nextIndex === -1) return; // no empty boxes

      // fill box and mark tile as used
      const box = answerBoxes.querySelector(`.answer-box[data-index="${nextIndex}"]`);
      if (!box) return;
      box.textContent = letter;
      box.dataset.srcTile = tile.dataset.tileId; // remember which tile filled it

      tile.style.visibility = "hidden";
      tile.dataset.visible = "false";
      tile.dataset.filledAt = nextIndex;
    });

    letterBank.appendChild(tile);
  });
}

// =======================
//  FIND NEXT EMPTY BOX
// =======================
function findNextEmptyBoxIndex() {
  const boxes = document.querySelectorAll(".answer-box");
  for (let box of boxes) {
    if (box.textContent === "") return parseInt(box.dataset.index, 10);
  }
  return -1;
}

// =======================
//    CLEAR (DESELECT) BOX
// =======================
function clearBox(boxIndex) {
  const box = answerBoxes.querySelector(`.answer-box[data-index="${boxIndex}"]`);
  if (!box) return;

  const tileId = box.dataset.srcTile;
  box.textContent = "";
  delete box.dataset.srcTile;

  // find the tile that was used and restore it
  if (tileId) {
    const tile = letterBank.querySelector(`.letter-tile[data-tile-id="${tileId}"]`);
    if (tile) {
      tile.style.visibility = ""; // restore visibility
      tile.dataset.visible = "true";
      delete tile.dataset.filledAt;
    } else {
      // in case tile node was removed or replaced for some reason:
      // create a new visible tile with that letter
      const restored = document.createElement("div");
      restored.classList.add("letter-tile");
      restored.textContent = ""; // unknown letter (unlikely)
      letterBank.appendChild(restored);
    }
  } else {
    // no tile recorded (edge case) — leave box cleared
  }
}

// =======================
//       SHUFFLE UI
// =======================
// Shuffle function that does NOT regenerate tiles
// - shuffles visible tiles in the letter bank (re-orders DOM)
// - also scrambles letters among filled answer boxes only (keeps box count and tile associations)

function shuffleTilesAndFilledBoxes() {
  // 1) Shuffle letter tiles DOM order (preserve visibility states)
  const tiles = Array.from(letterBank.querySelectorAll(".letter-tile"));
  tiles.sort(() => Math.random() - 0.5);
  // re-append in new order
  tiles.forEach(t => letterBank.appendChild(t));

  // 2) Shuffle letters among currently filled boxes ONLY (do not touch empty ones)
  const filledBoxes = Array.from(answerBoxes.querySelectorAll(".answer-box"))
    .filter(b => b.textContent !== "");

  if (filledBoxes.length <= 1) return; // nothing meaningful to shuffle

  // Extract letters and their source tile ids
  const letters = filledBoxes.map(b => b.textContent);
  const tileIds = filledBoxes.map(b => b.dataset.srcTile || null);

  // Shuffle letters array (Fisher-Yates)
  for (let i = letters.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [letters[i], letters[j]] = [letters[j], letters[i]];
    [tileIds[i], tileIds[j]] = [tileIds[j], tileIds[i]];
  }

  // Put shuffled letters + tile associations back into boxes
  filledBoxes.forEach((box, idx) => {
    box.textContent = letters[idx];
    box.dataset.srcTile = tileIds[idx] || "";
    // Update the tile.filledAt mapping to match new box index if tile exists
    if (tileIds[idx]) {
      const tile = letterBank.querySelector(`.letter-tile[data-tile-id="${tileIds[idx]}"]`);
      if (tile) {
        tile.dataset.filledAt = box.dataset.index;
      }
    }
  });
}

// =======================
//  OPTIONAL: get current answer string
// =======================

function getCurrentAnswerFromBoxes() {
  return Array.from(answerBoxes.querySelectorAll(".answer-box"))
    .map(b => b.textContent || "")
    .join("");
}

// =======================
//      COLLECT ANSWER
// =======================
function getPlayerAnswer() {
  const boxes = document.querySelectorAll(".answer-box");
  return [...boxes].map(b => b.textContent).join("");
}

// =======================
//      CHECK ANSWER
// =======================
checkBtn.addEventListener("click", () => {
  const player = getPlayerAnswer();
  const correct = levels[currentLevel].answer;

  if (player === correct) {
    customAlert("Correct! 🎉");
    nextBtn.style.display = "inline-block";
    checkBtn.style.display = "none";
    addScore(10);
  } else {
    customAlert("Try again 😅");
  }
});

// =======================
//      NEXT LEVEL
// =======================
nextBtn.addEventListener("click", () => {
  currentLevel++;

  if (currentLevel >= levels.length) {
    customAlert("You finished all levels!");
    return;
  }

  loadLevel();
});

// =======================
//     SHUFFLE BUTTON
// =======================
shuffleBtn.addEventListener("click", () => {
  shuffleTilesAndFilledBoxes();
});


// Start game
fetchLevels();