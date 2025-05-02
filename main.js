import { initializeApp } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-app.js";
import { getDatabase, ref, onValue, runTransaction } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-database.js";
import { getAuth, signInAnonymously, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-auth.js";

// Firebase config
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "catordogonline.firebaseapp.com",
  databaseURL: "https://catordogonline-default-rtdb.firebaseio.com",
  projectId: "catordogonline",
  storageBucket: "catordogonline.appspot.com",
  messagingSenderId: "559934644373",
  appId: "1:559934644373:web:655dc88061e2a4b87d7b9c"
};

// Init
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const auth = getAuth();

let userId = null;

// Wait for anonymous auth
signInAnonymously(auth)
  .then(() => console.log('[Auth] Signed in anonymously'))
  .catch(err => console.error('[Auth] Sign-in failed:', err.message));

onAuthStateChanged(auth, (user) => {
  if (user) {
    userId = user.uid;
    enableVoting(); // Begin logic after auth is ready
  } else {
    console.warn('[Auth] User signed out');
  }
});

// DOM Elements
const dogArea = document.getElementById('dog-area');
const catArea = document.getElementById('cat-area');
const dogText = document.getElementById('dog-text');
const catText = document.getElementById('cat-text');
const dogVotes = document.getElementById('dog-votes');
const catVotes = document.getElementById('cat-votes');

// Live vote sync
onValue(ref(db, 'votes'), (snapshot) => {
  const data = snapshot.val() || {};
  dogVotes.textContent = `Dog Votes: ${data.dog || 0}`;
  catVotes.textContent = `Cat Votes: ${data.cat || 0}`;
});

// --- Anti-Cheat Variables ---
let lastClick = 0;
let clickHistory = [];
let lastMouseMove = Date.now();

// Utility
function canClick() {
  const now = Date.now();
  if (now - lastClick >= 100) {
    lastClick = now;
    return true;
  }
  return false;
}

function flashBackground(element, className) {
  element.classList.add(className);
  setTimeout(() => element.classList.remove(className), 300);
}

function restartAnimation(element, animationName = 'moveText', duration = '0.3s') {
  element.style.animation = 'none';
  element.offsetHeight;
  element.style.animation = `${animationName} ${duration} ease-in-out`;
  element.addEventListener('animationend', () => {
    element.style.animation = 'none';
  }, { once: true });
}

function vote(animal, areaEl, textEl, flashClass) {
  if (!canClick() || !userId) return;

  const voteRef = ref(db, `votes/${animal}`);
  runTransaction(voteRef, (current) => (current || 0) + 1)
    .then(() => {
      console.log(`[Vote] ${animal} +1 by ${userId}`);
      flashBackground(areaEl, flashClass);
      restartAnimation(textEl);
    })
    .catch(err => console.error(`[Vote] Failed:`, err.message));
}

// --- Anti-Cheat Methods ---

document.addEventListener('click', (e) => {
  // Record click coordinates
  clickHistory.push({ x: e.clientX, y: e.clientY, time: Date.now() });

  // Clean old clicks
  clickHistory = clickHistory.filter(c => Date.now() - c.time < 20 * 60 * 1000);

  // Detect identical location clicks
  if (clickHistory.length >= 1000) {
    const first = clickHistory[0];
    const same = clickHistory.every(c =>
      Math.abs(c.x - first.x) < 20 && Math.abs(c.y - first.y) < 20
    );
    if (same) {
      window.location.href = "https://google.com";
    }
  }
});

setInterval(() => {
  const before = new Date();
  debugger;
  const after = new Date();
  if (after - before > 50) window.location.href = "https://google.com";
}, 1000);

const originalVote = vote.toString();
setInterval(() => {
  if (vote.toString() !== originalVote) {
    window.location.href = "https://google.com";
  }
}, 3000);

// Detect inactivity (no mouse movement)
document.addEventListener('mousemove', () => {
  lastMouseMove = Date.now();
});

setInterval(() => {
  if (Date.now() - lastMouseMove > 13 * 60 * 1000) {
    window.location.href = "https://google.com";
  }
}, 60000);

// Auto refresh after 20 minutes
setTimeout(() => {
  location.reload();
}, 20 * 60 * 1000);

// Start voting only after auth is ready
function enableVoting() {
  dogArea.addEventListener('click', () => vote('dog', dogArea, dogText, 'flash'));
  catArea.addEventListener('click', () => vote('cat', catArea, catText, 'flash'));
}
