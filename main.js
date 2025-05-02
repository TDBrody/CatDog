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

// Click limiter (100ms)
let lastClick = 0;
function canClick() {
  const now = Date.now();
  if (now - lastClick >= 100) {
    lastClick = now;
    return true;
  }
  return false;
}

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
dogArea.addEventListener('click', () => vote('dog', dogArea, dogText, 'flash'));
catArea.addEventListener('click', () => vote('cat', catArea, catText, 'flash'));

// --- Anti-autoclicker 1: Same interval detection ---
let clickTimes = [];

function checkAutoclicking() {
  if (clickTimes.length < 10) return false;

  const intervals = clickTimes.slice(1).map((t, i) => t - clickTimes[i]);
  const avg = intervals.reduce((a, b) => a + b) / intervals.length;
  const variance = intervals.reduce((a, b) => a + Math.abs(b - avg), 0) / intervals.length;

  const timeSpan = clickTimes[clickTimes.length - 1] - clickTimes[0];
  if (variance < 10 && timeSpan >= 20 * 60 * 1000) {
    return true;
  }

  return false;
}

// --- Anti-autoclicker 2: Same spot detection with tolerance ---
let clickX = null;
let clickY = null;
let sameSpotStart = null;

document.addEventListener('click', (e) => {
  const now = Date.now();

  // Track interval patterns
  clickTimes.push(now);
  if (clickTimes.length > 100) clickTimes.shift();

  if (checkAutoclicking()) {
    window.location.href = 'https://www.google.com';
    return;
  }

  // Check same spot clicking
  const tolerance = 5;
  if (
    clickX !== null &&
    Math.abs(e.clientX - clickX) <= tolerance &&
    Math.abs(e.clientY - clickY) <= tolerance
  ) {
    if (!sameSpotStart) {
      sameSpotStart = now;
    } else if (now - sameSpotStart >= 20 * 60 * 1000) {
      window.location.href = 'https://www.google.com';
    }
  } else {
    clickX = e.clientX;
    clickY = e.clientY;
    sameSpotStart = now;
  }
});
