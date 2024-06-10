import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.1/firebase-app.js";
import { getDatabase, ref, onValue } from "https://www.gstatic.com/firebasejs/10.12.1/firebase-database.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.1/firebase-auth.js";

// Firebase configuration object
const firebaseConfig = {
  apiKey: "AIzaSyCiEZsjiaintF14Y0MB0lOjYCJRnIV8jqA",
  authDomain: "community-27dcf.firebaseapp.com",
  projectId: "community-27dcf",
  storageBucket: "community-27dcf.appspot.com",
  messagingSenderId: "888962297245",
  appId: "1:888962297245:web:1d3fe7d6f9b211526d9374",
  measurementId: "G-FP14CRMLTB"
};

// Initialize Firebase app and auth
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getDatabase(app);

class Auth {
  static init() {
    window.addEventListener('DOMContentLoaded', Auth.checkCredentials);
    document.querySelector('.signoutbtn').addEventListener('click', Auth.signOut);
  }

  static checkCredentials() {
    onAuthStateChanged(auth, (user) => {
      if (!user) {
        window.location.href = '../loginpage/login.html';
      }
    });
  }

  static signOut() {
    auth.signOut().then(() => {
      window.location.href = '../loginpage/login.html';
    }).catch((error) => {
      console.error('Error signing out:', error);
    });
  }
}

class TableData {
  static init() {
    window.addEventListener('DOMContentLoaded', TableData.loadTableData);
  }

  static loadTableData() {
    const usersRef = ref(db, 'users');

    onValue(usersRef, (snapshot) => {
      const data = [];
      snapshot.forEach((userSnapshot) => {
        const userId = userSnapshot.key;
        const userInfo = userSnapshot.val();
        const numLikes = userInfo.numLikes || 0;
        if (numLikes > 0) { // Only include users with more than 0 likes
          const fullName = `${userInfo.firstName} ${userInfo.lastName}`;
          data.push({ userId, fullName, numLikes });
        }
      });

      data.sort((a, b) => b.numLikes - a.numLikes); // Sort in descending order

      const ulContainer = document.querySelector('.container');
      ulContainer.innerHTML = ''; // Clear the list

      data.forEach((user) => {
        const listItem = document.createElement('li');

        const nameSpan = document.createElement('span');
        nameSpan.textContent = user.fullName;
        nameSpan.classList.add('name');

        const likesSpan = document.createElement('span');
        likesSpan.textContent = user.numLikes;
        likesSpan.classList.add('likes');

        listItem.appendChild(nameSpan);
        listItem.appendChild(likesSpan);

        ulContainer.appendChild(listItem);
      });
    }, (error) => {
      console.error('Error loading table data:', error);
    });
  }
}

document.addEventListener('DOMContentLoaded', () => {
  Auth.init();
  TableData.init();
});
