import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.1/firebase-app.js";
import { getDatabase, ref, set, onChildAdded, onChildRemoved, get, push } from "https://www.gstatic.com/firebasejs/10.12.1/firebase-database.js";
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

    // Monitor authentication state changes
    onAuthStateChanged(auth, (user) => {
      if (user) {
        // Listen to the 'posts' node for all users
        const postsRef = ref(db, 'users/' + user.uid + '/posts');

        // Add new posts to the DOM when added to the database
        onChildAdded(postsRef, (snapshot) => {
          const post = snapshot.val();
          const postId = snapshot.key;
          if (!document.getElementById(postId)) {
            Post.addPostToDOM(postId, post.title, post.content, post.image, post.userId);
          }
        });

        // Remove post from DOM when it's removed from the database
        onChildRemoved(postsRef, (snapshot) => {
          const postId = snapshot.key;
          const postElement = document.getElementById(postId);
          if (postElement) {
            postElement.remove();
          }
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
    // Check if the title and content are provided
    const reqTitle = document.getElementById('title-input').value;
    const reqTxt = document.getElementById('request-textarea').value;

    if (!reqTitle.trim() || !reqTxt.trim()) {
      alert("Title and content are required.");
      return;
    }

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

    get(ref(db, `users/${userId}`)).then((snapshot) => {
      if (snapshot.exists()) {
        const userInfo = snapshot.val();
        set(ref(db, `users/${userId}/posts/${postId}`), {
          userId: userId,
          firstName: userInfo.firstName,
          lastName: userInfo.lastName,
          title: reqTitle,
          content: reqTxt,
          image: imgSrc
        })
          .then(() => {
            alert("Data Added Successfully");
          })
          .catch((error) => {
            console.error("Error saving post:", error); // Log error
            alert("Unsuccessful: " + error.message);
          });

        // Hide post-related elements
        Post.hidePostElements();
      } else {
        console.log("No user data available");
      }
    }).catch((error) => {
      console.error(error);
    });
  }

  static addPostToDOM(postId, title, content, image, userId) {
    // Fetch user data to get the full name
    get(ref(db, `users/${userId}`)).then((snapshot) => {
      if (snapshot.exists()) {
        const userInfo = snapshot.val();
        const fullName = `${userInfo.firstName} ${userInfo.lastName}`;

        // Create and add the post element to the DOM
        const postDiv = document.createElement("div");
        postDiv.classList.add("user-posts");
        postDiv.id = postId;

        const titlePost = document.createElement("h1");
        titlePost.innerText = title;

        const newPost = document.createElement("p");
        newPost.classList.add("content");
        newPost.innerText = content;

        const userIdElement = document.createElement("p");
        userIdElement.innerText = `Posted by: ${fullName}`;

        const objContainer = document.createElement("div");
        objContainer.classList.add("userid-container");
        postDiv.appendChild(titlePost);
        postDiv.appendChild(newPost);

        const commentButton = document.createElement("button");
        commentButton.innerHTML = '<i class="ri-chat-4-line"></i>';
        commentButton.classList.add("comment-btn");

        if (image) {
          const postImg = document.createElement('img');
          postImg.src = image;
          postImg.style.maxWidth = '100%';
          postDiv.appendChild(postImg);
        }

        postDiv.appendChild(objContainer);
        objContainer.appendChild(userIdElement);
        objContainer.appendChild(commentButton);

        // Prepend the post element to the personal container to display it at the top
        document.getElementById('personal-container').prepend(postDiv);

        // Add event listener to comment button
        commentButton.addEventListener('click', () => {
          // Check if comment input area and submit button already exist
          let commentInput = postDiv.querySelector('.comment-input');
          let submitButton = postDiv.querySelector('.comment-submit');
          const existingComments = postDiv.querySelectorAll('.comment');

          if (commentInput && submitButton) {
            // If they exist, remove them and any existing comments
            commentInput.remove();
            submitButton.remove();
            existingComments.forEach(comment => comment.remove());
          } else {
            // If they don't exist, create and append them
            commentInput = document.createElement('textarea');
            commentInput.placeholder = 'Enter your comment...';
            commentInput.classList.add('comment-input');

            submitButton = document.createElement('button');
            submitButton.innerText = 'Submit';
            submitButton.classList.add('comment-submit');

            // Add event listener to submit button
            submitButton.addEventListener('click', () => {
              const commentContent = commentInput.value.trim();
              if (commentContent) {
                // Save the comment to the database
                Post.saveComment(postId, userId, commentContent, fullName);

                // Clear the comment input area
                commentInput.value = '';
              }
            });

            // Append comment input and submit button below the comment button
            postDiv.appendChild(commentInput);
            postDiv.appendChild(submitButton);
          }
        });

        // Load existing comments for the post
        Post.loadComments(postId, postDiv, userId);
      } else {
        console.log("No user data available");
      }
    }).catch((error) => {
      console.error(error);
    });
  }

  static saveComment(postId, userId, commentContent, fullName) {
    const commentId = Date.now().toString();
    const commentData = {
      userId: userId,
      content: commentContent,
      fullName: fullName,
      timestamp: Date.now()
    };
  
    // Set the comment data under the user's post
    set(ref(db, `users/${userId}/posts/${postId}/comments/${commentId}`), commentData)
      .then(() => {
        console.log("Comment saved successfully");
      })
      .catch((error) => {
        console.error("Error saving comment:", error);
      });
  }

  static loadComments(postId, postDiv, userId) {
    const commentsRef = ref(db, `users/${userId}/posts/${postId}/comments`);
    onChildAdded(commentsRef, (snapshot) => {
      const comment = snapshot.val();
      Post.displayComment(comment, postDiv);
    }, (error) => {
      console.error("Error loading comments:", error);
    });
  }

  static displayComment(comment, postDiv) {
    const commentElement = document.createElement('div');
    commentElement.classList.add('comment');
    commentElement.innerHTML = `<p>${comment.fullName}:</p><p>${comment.content}</p>`;
    postDiv.appendChild(commentElement);
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
