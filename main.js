import { initializeApp } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-app.js";
import { getDatabase, ref, onValue, runTransaction } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-database.js";
import { getAuth, signInAnonymously } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-auth.js";

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

// Init Firebase
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const auth = getAuth();

// Authenticate anonymously
signInAnonymously(auth)
  .then(() => console.log("User authenticated anonymously"))
  .catch((error) => console.error("Authentication failed:", error));

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

// Voting function
function vote(animal, areaEl, textEl, flashClass) {
  const voteRef = ref(db, `votes/${animal}`);
  runTransaction(voteRef, (current) => (current || 0) + 1)
    .then(() => {
      console.log(`[Vote] ${animal} +1`);
      flashBackground(areaEl, flashClass);
      restartAnimation(textEl);
    })
    .catch((err) => console.error(`[Vote] Failed:`, err.message));
}

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

// Click event listeners
dogArea.addEventListener('click', () => {
  if (canClick()) {
    vote('dog', dogArea, dogText, 'flash');
  }
});

catArea.addEventListener('click', () => {
  if (canClick()) {
    vote('cat', catArea, catText, 'flash');
  }
});
