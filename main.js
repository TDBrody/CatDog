import { initializeApp } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-app.js";
import { getDatabase, ref, onValue, runTransaction, set } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-database.js";

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

// Init Firebase
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// DOM Elements
const milestoneBanner = document.getElementById('milestone-banner');
const dogArea = document.getElementById('dog-area');
const catArea = document.getElementById('cat-area');
const dogText = document.getElementById('dog-text');
const catText = document.getElementById('cat-text');
const dogVotes = document.getElementById('dog-votes');
const catVotes = document.getElementById('cat-votes');
const supportBtn = document.getElementById('support-btn');

// Load live votes
onValue(ref(db, 'votes'), (snapshot) => {
  const data = snapshot.val() || {};
  dogVotes.textContent = `Dog Votes: ${data.dog || 0}`;
  catVotes.textContent = `Cat Votes: ${data.cat || 0}`;
});

// Listen for milestone updates (to show the announcement)
onValue(ref(db, 'milestone'), (snapshot) => {
  const message = snapshot.val();
  if (message) {
    milestoneBanner.textContent = message;
    milestoneBanner.style.display = 'block';
    setTimeout(() => {
      milestoneBanner.style.display = 'none';
    }, 4000); // auto-hide
  }
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
  element.offsetHeight; // Trigger reflow
  element.style.animation = `${animationName} ${duration} ease-in-out`;
  element.addEventListener('animationend', () => {
    element.style.animation = 'none';
  }, { once: true });
}

function moveDonateBox() {
  supportBtn.style.animation = 'moveDonateBox 1s ease-in-out';
  supportBtn.addEventListener('animationend', () => {
    supportBtn.style.animation = 'none'; // Reset the animation
  }, { once: true });
}

function vote(animal, element, textElement, className) {
  if (!canClick()) return;
  const voteRef = ref(db, `votes/${animal}`);
  runTransaction(voteRef, (current) => (current || 0) + 1)
    .then(() => {
      // Check if the vote count reaches a milestone and update the milestone
      onValue(ref(db, `votes/${animal}`), (snapshot) => {
        const count = snapshot.val();
        if (count % 1000 === 0) {
          const milestoneRef = ref(db, 'milestone');
          set(milestoneRef, `Milestone: ${count} votes for ${animal}`);
        }
      });
      console.log(`[Vote] ${animal} +1`);
      flashBackground(element, className);
      restartAnimation(textElement, 'moveText');
      moveDonateBox(); // Move the donate box on vote
    })
    .catch(err => console.error(`[Vote] Failed:`, err.message));
}

// Firebase Authentication for anonymous sign-in
import { getAuth, signInAnonymously } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-auth.js";

// Initialize Firebase Authentication
const auth = getAuth(app);

// Sign in anonymously (add this when the page loads)
signInAnonymously(auth)
  .then(() => {
    console.log("User signed in anonymously.");
  })
  .catch((error) => {
    console.error("Error signing in anonymously:", error);
  });

// Click handlers
dogArea.addEventListener('click', () => vote('dog', dogArea, dogText, 'flash'));
catArea.addEventListener('click', () => vote('cat', catArea, catText, 'flash'));
let clickTimes = []; // Array to store click timestamps
let intervalTolerance = 10; // Allowable variance in the interval (±20ms)
let timeWindow = 60000; // 1 minute (60,000 milliseconds)
let maxClicks = 200; // Max number of clicks to track in the time window

function detectConsistentIntervals() {
  const now = Date.now();

  // Remove clicks older than the time window (1 minute)
  clickTimes = clickTimes.filter(time => now - time < timeWindow);

  // Add the current click timestamp
  clickTimes.push(now);

  // Check if the user has clicked more than 2 times in the last minute
  if (clickTimes.length > 1) {
    let isSuspectedAutoClicker = false;

    // Loop through all the clicks and check if they follow a consistent interval
    for (let i = 1; i < clickTimes.length; i++) {
      const interval = clickTimes[i] - clickTimes[i - 1]; // Time between consecutive clicks

      // Check if the interval is consistent (within the tolerance)
      if (i > 1 && Math.abs(interval - (clickTimes[i - 1] - clickTimes[i - 2])) > intervalTolerance) {
        isSuspectedAutoClicker = false;
        break;
      } else {
        isSuspectedAutoClicker = true;
      }
    }

    // If consistent clicking pattern is detected, redirect the user
    if (isSuspectedAutoClicker && clickTimes.length >= 5) {
      alert("Suspicious clicking detected. You will be redirected to Google.");
      window.location.href = "https://www.google.com"; // Redirect to Google
    }
  }
}

// Example of using this in a click handler
document.getElementById('dog-area').addEventListener('click', () => {
  detectConsistentIntervals();
});

document.getElementById('cat-area').addEventListener('click', () => {
  detectConsistentIntervals();
});
