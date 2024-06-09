import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.1/firebase-app.js";
import { getDatabase, ref, set, onChildAdded, onChildRemoved, get, push, remove } from "https://www.gstatic.com/firebasejs/10.12.1/firebase-database.js";
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
        // Listen to all users' posts
        const usersRef = ref(db, 'users');
        onChildAdded(usersRef, (snapshot) => {
          const userId = snapshot.key;
          const postsRef = ref(db, `users/${userId}/posts`);

          // Add new posts to the DOM when added to the database
          onChildAdded(postsRef, (snapshot) => {
            const post = snapshot.val();
            const postId = snapshot.key;
            if (!document.getElementById(postId)) {
              Post.addPostToDOM(postId, post.title, post.content, post.image, userId, user.uid);
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

  static addPostToDOM(postId, title, content, image, userId, currentUserId) {
    get(ref(db, `users/${userId}`)).then((snapshot) => {
      if (snapshot.exists()) {
        const userInfo = snapshot.val();
        const fullName = `${userInfo.firstName} ${userInfo.lastName}`;

        const outerDiv = document.createElement("div");
        outerDiv.classList.add("outer-post");
        outerDiv.id = postId; // post id

        const postDiv = document.createElement("div");
        postDiv.classList.add("user-posts");
       

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
        outerDiv.appendChild(postDiv);
        postDiv.appendChild(objContainer);
        objContainer.appendChild(userIdElement);
        objContainer.appendChild(commentButton);

        // Create and append a delete button if the current user is the owner of the post
        if (userId === currentUserId) {
          const completeButton = document.createElement("button");
          completeButton.innerText = "Complete";
          completeButton.classList.add("complete-btn");

          completeButton.addEventListener('click', () => {
            Post.deletePost(userId, postId);
          });
          outerDiv.appendChild(completeButton); // Append the delete button
        }

        document.getElementById('personal-container').prepend(outerDiv);

        commentButton.addEventListener('click', () => {
          let commentInput = postDiv.querySelector('.comment-input');
          let submitButton = postDiv.querySelector('.comment-submit');
          let commentsSection = postDiv.querySelector('.comments-section');

          if (commentInput && submitButton) {
            commentInput.remove();
            submitButton.remove();
            if (commentsSection) {
              commentsSection.remove();
            }
          } else {
            commentInput = document.createElement('textarea');
            commentInput.placeholder = 'Enter your comment...';
            commentInput.classList.add('comment-input');

            submitButton = document.createElement('button');
            submitButton.innerText = 'Submit';
            submitButton.classList.add('comment-submit');

            submitButton.addEventListener('click', (event) => {
              event.preventDefault();
              const commentContent = commentInput.value.trim();
              if (commentContent) {
                Post.saveComment(userId, postId, commentContent, userInfo);
                commentInput.value = '';
              }
            });

            commentsSection = document.createElement('div');
            commentsSection.classList.add('comments-section');
            postDiv.appendChild(commentsSection);

            postDiv.appendChild(commentInput);
            postDiv.appendChild(submitButton);

            Post.loadComments(userId, postId, commentsSection);
          }
        });
      } else {
        console.log("No user data available");
      }
    }).catch((error) => {
      console.error(error);
    });
  }

  static deletePost(userId, postId) {
    // Check if the current user is the owner of the post
    onAuthStateChanged(auth, (user) => {
      if (user && user.uid === userId) {
        remove(ref(db, `users/${userId}/posts/${postId}`))
          .then(() => {
            document.getElementById(postId).remove();
            console.log("Post deleted successfully");
          })
          .catch((error) => {
            console.error("Error deleting post:", error);
          });
      } else {
        alert("You can only delete your own posts.");
      }
    });
  }

  static saveComment(userId, postId, commentContent) {
    // Generate a unique comment ID based on the current timestamp
    const commentId = Date.now().toString();

    // Listen for changes in the authentication state
    onAuthStateChanged(auth, (user) => {
      // Check if the user is authenticated
      if (user) {
        // Fetch the authenticated user's information from the database
        get(ref(db, `users/${user.uid}`)).then((snapshot) => {
          // Check if the user data exists in the snapshot
          if (snapshot.exists()) {
            // Retrieve user information from the snapshot
            const userInfo = snapshot.val();
            // Combine first name and last name to get the full name
            const fullName = `${userInfo.firstName} ${userInfo.lastName}`;

            // Create a comment data object with necessary details
            const commentData = {
              userId: user.uid, // ID of the authenticated user
              content: commentContent, // Content of the comment
              fullName: fullName, // Full name of the user
              timestamp: Date.now() // Current timestamp
            };

            // Save the comment data under the specified user's post in the database
            set(ref(db, `users/${userId}/posts/${postId}/comments/${commentId}`), commentData)
              .then(() => {
                // Log success message if the comment is saved successfully
                console.log("Comment saved successfully");
              })
              .catch((error) => {
                // Log error message if there's an issue saving the comment
                console.error("Error saving comment:", error);
              });
          } else {
            // Log message if no user data is available in the snapshot
            console.log("No user data available");
          }
        }).catch((error) => {
          // Log error if there's an issue fetching the user data
          console.error(error);
        });
      }
    });
  }

  static loadComments(userId, postId, postDiv) {
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
