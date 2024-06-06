import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.1/firebase-app.js";
import { getDatabase, ref, set, onChildRemoved, onChildAdded } from "https://www.gstatic.com/firebasejs/10.12.1/firebase-database.js";
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

// Initialize Firebase app, database, and auth
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const auth = getAuth(app);

// Auth class for handling authentication-related functionality
class Auth {
  static init() {
    // Check credentials when the DOM content is loaded
    window.addEventListener('DOMContentLoaded', Auth.checkCredentials);
    // Sign out when the sign out button is clicked
    document.getElementById('signoutbtn').addEventListener('click', Auth.signOut);
  }

  static checkCredentials() {
    // Redirect to login page if user credentials are not found in session storage
    if (!sessionStorage.getItem("user-creds")) {
      window.location.href = '../loginpage/login.html';
    }
  }

  static signOut() {
    // Remove user credentials and info from session storage and redirect to login page
    sessionStorage.removeItem("user-creds");
    sessionStorage.removeItem("user-info");
    window.location.href = '../loginpage/login.html';
  }
}

// Post class for handling post-related functionality
class Post {
  static init() {
    // Add event listeners for post interactions
    document.getElementById('request-textarea').addEventListener('focus', Post.showPostElements);
    document.getElementById('close').addEventListener('click', Post.hidePostElements);
    document.getElementById('firstimg').addEventListener('change', Post.previewImage);
    document.getElementById('post-btn').addEventListener("click", Post.addPost);

    // Retrieve posts from local storage
    Post.retrievePosts();

    // Monitor authentication state changes
    onAuthStateChanged(auth, (user) => {
      if (user) {
        const userId = user.uid;
        const userPostsRef = ref(db, 'users/' + userId + '/posts');

        // Remove post from DOM when it's removed from the database
        onChildRemoved(userPostsRef, (snapshot) => {
          const postId = snapshot.key;
          const postElement = document.getElementById(postId);
          if (postElement) {
            postElement.remove();
          }

          // Remove post from local storage
          Post.removeLocal(postId);
        });

        // Add post to DOM when a new post is added to the database
        onChildAdded(userPostsRef, (snapshot) => {
          const post = snapshot.val();
          const postId = snapshot.key;
          Post.addPostToDOM(postId, post.title, post.content, post.image);
          Post.saveLocal(postId, post.title, post.content, post.image);
        });
      }
    });
  }

  static showPostElements() {
    // Show post-related elements when the textarea is focused
    document.getElementById('title-input').style.display = 'block';
    document.getElementById('close').style.display = 'block';
    document.getElementById('post-btn').style.display = 'block';
    document.getElementById('file').style.display = 'block';
  }

  static hidePostElements() {
    // Hide post-related elements and reset their values
    document.getElementById('title-input').style.display = 'none';
    document.getElementById('request-textarea').style.height = '6rem';
    document.getElementById('close').style.display = 'none';
    document.getElementById('file').style.display = 'none';
    document.getElementById('post-btn').style.display = 'none';
    document.getElementById('display-image').innerHTML = '';
    document.getElementById('display-image').style.display = 'none';
  }

  static previewImage(event) {
    // Display a preview of the selected image
    const file = event.target.files[0];
    const displayImage = document.getElementById('display-image');

    if (file) {
      const reader = new FileReader();
      displayImage.style.display = 'block';

      reader.onload = (e) => {
        const imgElement = document.createElement('img');
        imgElement.classList.add("image");
        imgElement.src = e.target.result;
        imgElement.style.maxWidth = '100%';

        const removeButton = document.createElement('button');
        removeButton.classList.add("remove-image");
        removeButton.innerHTML = '<i class="ri-delete-bin-6-line"></i>';
        removeButton.addEventListener('click', () => {
          document.getElementById('firstimg').value = '';
          displayImage.innerHTML = '';
          displayImage.style.display = 'none';
        });

        displayImage.innerHTML = '';
        displayImage.appendChild(imgElement);
        displayImage.appendChild(removeButton);
      };

      reader.readAsDataURL(file);
    }
  }

  static addPost() {
    // Add a new post if the user is authenticated
    onAuthStateChanged(auth, (user) => {
      if (user) {
        Post.savePost(user.uid);
      } else {
        console.log("User is not logged in");
      }
    });
  }

  static savePost(userId) {
    // Get post details and save the post to the database
    const reqTitle = document.getElementById('title-input').value;
    const reqTxt = document.getElementById('request-textarea').value;
    const imgElement = document.getElementById('display-image').querySelector('img');
    const imgSrc = imgElement ? imgElement.src : '';

    const postId = Date.now().toString();

    set(ref(db, 'users/' + userId + '/posts/' + postId), {
      title: reqTitle,
      content: reqTxt,
      image: imgSrc
    })
      .then(() => {
        alert("Data Added Successfully");
      })
      .catch((error) => {
        alert("Unsuccessful: " + error.message);
      });

    // Add the post to the DOM and local storage
    Post.addPostToDOM(postId, reqTitle, reqTxt, imgSrc);
    Post.saveLocal(postId, reqTitle, reqTxt, imgSrc);
    Post.hidePostElements();
  }

  static addPostToDOM(postId, title, content, image) {
    // Create and add the post element to the DOM
    const PostDiv = document.createElement("div");
    PostDiv.classList.add("user-posts");
    PostDiv.id = postId;

    const titlePost = document.createElement("h1");
    titlePost.innerText = title;

    const newPost = document.createElement("p");
    newPost.innerText = content;

    PostDiv.appendChild(titlePost);
    PostDiv.appendChild(newPost);
    if (image) {
      const postImg = document.createElement('img');
      postImg.src = image;
      postImg.style.maxWidth = '100%';
      PostDiv.appendChild(postImg);
    }

    // Instead of using appendChild,  prepend the post element to the personal container to display it at the top
    document.getElementById('personal-container').prepend(PostDiv);
  }

  static saveLocal(postId, title, content, image) {
    // Save the post to local storage
    let posts = JSON.parse(localStorage.getItem('posts')) || [];
    posts.push({ postId, title, content, image });
    localStorage.setItem('posts', JSON.stringify(posts));
  }

  static retrievePosts() {
    // Retrieve posts from local storage and add them to the DOM
    // Reverse posts array to display latest posts on top
    let posts = JSON.parse(localStorage.getItem('posts')) || [];
    posts.reverse().forEach(post => {
      if (post && post.postId && post.title && post.content) {
        Post.addPostToDOM(post.postId, post.title, post.content, post.image);
      }
    });
  }

  static removeLocal(postId) {
    // Remove a post from local storage
    let posts = JSON.parse(localStorage.getItem('posts')) || [];
    posts = posts.filter(post => post.postId !== postId);
    localStorage.setItem('posts', JSON.stringify(posts));
  }
}

// Initialize authentication and post functionalities when the DOM content is loaded
document.addEventListener('DOMContentLoaded', () => {
  Auth.init();
  Post.init();

  // Auto-expand the textarea as the user types
  document.getElementById('request-textarea').addEventListener('input', function () {
    this.style.height = 'auto';
    this.style.overflow = 'hidden';
    const scrollHeight = this.scrollHeight;
    this.style.height = `${scrollHeight}px`;

    if (scrollHeight >= 500) {
      this.style.maxHeight = '500px';
      this.style.overflow = 'visible';
    } else {
      this.style.maxHeight = null;
      this.style.overflow = 'hidden';
    }
  });
});
