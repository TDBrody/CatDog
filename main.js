import { initializeApp } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-app.js";
import { getDatabase, ref, onValue, runTransaction } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-database.js";

// Firebase config (public-only usage)
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

// Load live votes
onValue(ref(db, 'votes'), (snapshot) => {
  const data = snapshot.val() || {};
  dogVotes.textContent = `Dog Votes: ${data.dog || 0}`;
  catVotes.textContent = `Cat Votes: ${data.cat || 0}`;
});

// Utility
let lastClick = 0;
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
  setTimeout(() => {
    element.classList.remove(className);
  }, 300);
}

function restartAnimation(element, animationName = 'moveText', duration = '0.3s') {
  element.style.animation = 'none';
  element.offsetHeight;
  element.style.animation = `${animationName} ${duration} ease-in-out`;
  element.addEventListener('animationend', () => {
    element.style.animation = 'none';
  }, { once: true });
}

function vote(animal, element, textElement, className) {
  if (!canClick()) return;

  const voteRef = ref(db, `votes/${animal}`);
  runTransaction(voteRef, (current) => (current || 0) + 1)
    .then(() => {
      console.log(`[Vote] ${animal} +1`);
      flashBackground(element, className);
      restartAnimation(textElement, 'moveText');
    })
    .catch(err => console.error(`[Vote] Failed:`, err.message));
}

// Click handlers
dogArea.addEventListener('click', () => vote('dog', dogArea, dogText, 'flash'));
catArea.addEventListener('click', () => vote('cat', catArea, catText, 'flash'));
