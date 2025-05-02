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

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// DOM Elements
const dogArea = document.getElementById('dog-area');
const catArea = document.getElementById('cat-area');
const dogText = document.getElementById('dog-text');
const catText = document.getElementById('cat-text');
const dogVotes = document.getElementById('dog-votes');
const catVotes = document.getElementById('cat-votes');
const circleAnimation = document.getElementById('circle-animation');

// Load live votes from Firebase
onValue(ref(db, 'votes'), (snapshot) => {
    const data = snapshot.val() || {};
    dogVotes.textContent = `Dog Votes: ${data.dog || 0}`;
    catVotes.textContent = `Cat Votes: ${data.cat || 0}`;
});

// Create a circle animation on click
function createCircleAnimation(x, y, color) {
    circleAnimation.style.left = `${x - 50}px`;
    circleAnimation.style.top = `${y - 50}px`;
    circleAnimation.style.width = '100px';
    circleAnimation.style.height = '100px';
    circleAnimation.style.backgroundColor = color;
    circleAnimation.style.animation = 'circleExpand 1s ease-out';
    circleAnimation.style.opacity = '1';
    setTimeout(() => {
        circleAnimation.style.opacity = '0';
    }, 1000);
}

// Vote function
function vote(animal, element, textElement, color) {
    const voteRef = ref(db, `votes/${animal}`);
    runTransaction(voteRef, (current) => (current || 0) + 1)
        .then(() => {
            console.log(`[Vote] ${animal} +1`);
            createCircleAnimation(event.clientX, event.clientY, color);
        })
        .catch(err => console.error(`[Vote] Failed:`, err.message));
}

// Click event handlers
dogArea.addEventListener('click', () => vote('dog', dogArea, dogText, '#ff6666'));
catArea.addEventListener('click', () => vote('cat', catArea, catText, '#6cb3f7'));
