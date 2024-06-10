import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.1/firebase-app.js";
import { getDatabase, ref, set, onChildAdded, onChildRemoved, onChildChanged, get, push, remove } from "https://www.gstatic.com/firebasejs/10.12.1/firebase-database.js";
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

document.addEventListener('DOMContentLoaded', () => {
  Auth.init();
});
