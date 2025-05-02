import { initializeApp } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-app.js";
import { getDatabase, ref, onValue, runTransaction } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-database.js";
import { getAuth, signInAnonymously } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-auth.js";
import { initializeAppCheck, ReCaptchaV3Provider } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-app-check.js";

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

// Init Firebase app
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const auth = getAuth();

// Enable Firebase App Check with reCAPTCHA v3
const appCheck = initializeAppCheck(app, {
  provider: new ReCaptchaV3Provider('YOUR_RECAPTCHA_SITE_KEY'),
  isTokenAutoRefreshEnabled: true
});

// DOM Elements
const dogArea = document.getElementById('dog-area');
const catArea = document.getElementById('cat-area');
const dogText = document.getElementById('dog-text');
const catText = document.getElementById('cat-text');
const dogVotes = document.getElementById('dog-votes');
const catVotes = document.getElementById('cat-votes');
const supportBtn = document.getElementById('support-btn');

// Live vote sync
onValue(ref(db, 'votes'), (snapshot) => {
  const data = snapshot.val() || {};
  dogVotes.textContent = `Dog Votes: ${data.dog || 0}`;
  catVotes.textContent = `Cat Votes: ${data.cat || 0}`;
});

// Sign in anonymously (for security)
signInAnonymously(auth)
  .then(() => {
    console.log("User signed in anonymously.");
  })
  .catch((error) => {
    console.error("Error signing in:", error);
  });

// Click Limiter: Prevent auto-clickers
let lastClick = 0;
function canClick() {
  const now = Date.now();
  if (now - lastClick >= 100) {
    lastClick = now;
    return true;
  }
  return false;
}

// Anti-Cheat: Prevent voting too frequently from the same place or on the same interval
let lastVoteTime = 0;
let lastClickPosition = null;
let voteStreakTime = 0;  // Track how long someone clicks on the same spot

function isSuspiciousClick(event) {
  const now = Date.now();
  const timeDifference = now - lastVoteTime;
  const clickPosition = { x: event.clientX, y: event.clientY };
  const distance = lastClickPosition ? Math.sqrt(Math.pow(clickPosition.x - lastClickPosition.x, 2) + Math.pow(clickPosition.y - lastClickPosition.y, 2)) : 0;

  // If clicked in the same spot for over 20 minutes or with the same interval (100ms) for too long
  if (timeDifference <= 100 && distance < 10) {
    voteStreakTime += 100;
    if (voteStreakTime >= 1200000) { // 20 minutes
      window.location.href = 'https://www.google.com';  // Redirect to Google after 20 minutes of same-clicking
    }
  } else {
    voteStreakTime = 0;  // Reset if the position changes
  }
  
  lastVoteTime = now;
  lastClickPosition = clickPosition;
}

// Flash background on vote click
function flashBackground(element, className) {
  element.classList.add(className);
  setTimeout(() => element.classList.remove(className), 300);
}

function restartAnimation(element, animationName = 'moveText', duration = '0.3s') {
  element.style.animation = 'none';
  element.offsetHeight;  // Trigger reflow
  element.style.animation = `${animationName} ${duration} ease-in-out`;
  element.addEventListener('animationend', () => {
    element.style.animation = 'none';
  }, { once: true });
}

// Voting function
function vote(animal, areaEl, textEl, flashClass, event) {
  if (!canClick()) return;

  // Check for suspicious clicks (same position, interval)
  isSuspiciousClick(event);

  const voteRef = ref(db, `votes/${animal}`);
  runTransaction(voteRef, (current) => (current || 0) + 1)
    .then(() => {
      console.log(`[Vote] ${animal} +1`);
      flashBackground(areaEl, flashClass);
      restartAnimation(textEl);
    })
    .catch(err => console.error(`[Vote] Failed:`, err.message));
}

// Click listeners for voting
dogArea.addEventListener('click', (event) => vote('dog', dogArea, dogText, 'flash', event));
catArea.addEventListener('click', (event) => vote('cat', catArea, catText, 'flash', event));

// Refresh page after 20 minutes
let pageStartTime = Date.now();
setInterval(() => {
  if (Date.now() - pageStartTime >= 1200000) {  // 20 minutes
    window.location.reload();  // Refresh the page
  }
}, 60000);  // Check every minute
