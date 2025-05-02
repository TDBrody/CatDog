import { initializeApp } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-app.js";
import { getDatabase, ref, onValue, runTransaction } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-database.js";

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

// Click limiter
let lastClick = 0;
function canClick() {
  const now = Date.now();
  if (now - lastClick >= 100) {
    lastClick = now;
    return true;
  }
  return false;
}

// Anti-autoclicker: detect same-position clicking
let clickHistory = [];
let autoclickerDetected = false;
document.addEventListener('click', (e) => {
  const now = Date.now();
  clickHistory.push({ x: e.clientX, y: e.clientY, time: now });
  clickHistory = clickHistory.filter(entry => now - entry.time < 20 * 60 * 1000); // Keep 20 mins of clicks

  if (clickHistory.length > 1000) {
    const { x, y } = clickHistory[0];
    const sameSpot = clickHistory.every(click => {
      const dx = Math.abs(click.x - x);
      const dy = Math.abs(click.y - y);
      return dx <= 10 && dy <= 10;
    });
    if (sameSpot && !autoclickerDetected) {
      autoclickerDetected = true;
      window.location.href = "https://google.com";
    }
  }
});

// Animations
function flashBackground(element, className) {
  element.classList.add(className);
  setTimeout(() => element.classList.remove(className), 300);
}

function restartAnimation(element, animationName = 'moveText', duration = '0.3s') {
  element.style.animation = 'none';
  element.offsetHeight; // force reflow
  element.style.animation = `${animationName} ${duration} ease-in-out`;
  element.addEventListener('animationend', () => {
    element.style.animation = 'none';
  }, { once: true });
}

// Voting
function vote(animal, areaEl, textEl, flashClass) {
  if (!canClick()) return;

  const voteRef = ref(db, `votes/${animal}`);
  runTransaction(voteRef, (current) => (current || 0) + 1)
    .then(() => {
      console.log(`[Vote] ${animal} +1`);
      flashBackground(areaEl, flashClass);
      restartAnimation(textEl);
    })
    .catch(err => console.error(`[Vote] Failed:`, err.message));
}

// Listeners
dogArea.addEventListener('click', (e) => vote('dog', dogArea, dogText, 'flash'));
catArea.addEventListener('click', (e) => vote('cat', catArea, catText, 'flash'));

// --- Anti-Cheat Methods ---

// 1. Detect DevTools open
setInterval(() => {
  const before = new Date();
  debugger;
  const after = new Date();
  if (after - before > 50) {
    window.location.href = "https://google.com";
  }
}, 1000);

// 2. Detect if vote function is altered
const originalVoteString = vote.toString();
setInterval(() => {
  if (vote.toString() !== originalVoteString) {
    window.location.href = "https://google.com";
  }
}, 3000);

// 3. Refresh page after 20 minutes
setTimeout(() => {
  location.reload();
}, 20 * 60 * 1000);

// 4. Idle mouse movement detector
let lastMouseMove = Date.now();
document.addEventListener('mousemove', () => {
  lastMouseMove = Date.now();
});
setInterval(() => {
  if (Date.now() - lastMouseMove > 13 * 60 * 1000) {
    window.location.href = "https://google.com";
  }
}, 60000);
