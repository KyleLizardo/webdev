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

// Initialize Firebase app, database, and auth
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const auth = getAuth(app);

// Ensure global variables are defined and scoped properly
let allPosts = [];
let addedPostIds = new Set();

const ongoingPostOperations = new Set();

// Debounce function
function debounce(func, wait) {
  let timeout;
  return function (...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), wait);
  };
}

// Auth class for handling authentication-related functionality
class Auth {
  static init() {
    window.addEventListener('DOMContentLoaded', Auth.checkCredentials);
    document.querySelector('.signoutbtn').addEventListener('click', Auth.signOut);
  }

  static checkCredentials() {
    if (!sessionStorage.getItem("user-creds")) {
      window.location.href = '../loginpage/login.html';
    }
  }

  static signOut() {
    sessionStorage.removeItem("user-creds");
    sessionStorage.removeItem("user-info");
    window.location.href = '../loginpage/login.html';
  }
}

function showNotification(message, postId) {
  const notificationContainer = document.getElementById('notification-container');
  const notification = document.createElement('div');
  notification.classList.add('notification');
  notification.setAttribute('data-post-id', postId);
  notification.innerHTML = `
    <span>${message}</span>
    <button class="close-btn" onclick="this.parentElement.style.display='none';">&times;</button>
  `;
  notificationContainer.appendChild(notification);
  notificationContainer.style.display = 'block';

  // Add click event listener to navigate to the specific post
  notification.addEventListener('click', function () {
    navigateToPost(postId);
  });

  // Remove the notification after 5 seconds
  setTimeout(() => {
    notification.style.display = 'none';
  }, 5000);
}

function navigateToPost(postId) {
  const postElement = document.getElementById(`post-${postId}`);
  if (postElement) {
    // Scroll to the post element
    postElement.scrollIntoView({ behavior: 'smooth' });

    // Optionally, highlight the post element
    postElement.style.backgroundColor = '#ffffcc';
    setTimeout(() => {
      postElement.style.backgroundColor = '';
    }, 2000);
  } else {
    console.log('Post not found');
  }
}

// Setup real-time listeners for notifications
function setupNotificationListeners() {
  onAuthStateChanged(auth, (user) => {
    if (user) {
      const notificationsRef = ref(db, `users/${user.uid}/notifications`);

      onChildAdded(notificationsRef, (snapshot) => {
        const notification = snapshot.val();
        showNotification(notification.message, notification.postId);
      });
    }
  });
}

setupNotificationListeners();

function setupPostListeners() {
  const usersRef = ref(db, 'users');

  onAuthStateChanged(auth, (user) => {
    if (user) {
      onChildAdded(usersRef, (snapshot) => {
        const userId = snapshot.key;
        const postsRef = ref(db, `users/${userId}/posts`);

        onChildAdded(postsRef, (snapshot) => {
          const post = snapshot.val();
          const postId = snapshot.key;
          if (!addedPostIds.has(postId)) {
            addedPostIds.add(postId);
            allPosts.push({ userId, postId, post });
            Post.renderPosts(allPosts, user.uid);
          }
        });

        onChildRemoved(postsRef, (snapshot) => {
          const postId = snapshot.key;
          addedPostIds.delete(postId);
          allPosts = allPosts.filter(post => post.postId !== postId);
          Post.renderPosts(allPosts, user.uid);
        });

        onChildChanged(postsRef, (snapshot) => {
          const post = snapshot.val();
          const postId = snapshot.key;
          const postIndex = allPosts.findIndex(post => post.postId === postId);
          if (postIndex !== -1) {
            allPosts[postIndex].post = post;
            Post.renderPosts(allPosts, user.uid);
          }
        });
      });
    }
  });
}

setupPostListeners();

// Post class for handling post-related functionality
class Post {
  static init() {
    document.getElementById('request-textarea').addEventListener('focus', Post.showPostElements);
    document.getElementById('close').addEventListener('click', Post.hidePostElements);
    document.getElementById('firstimg').addEventListener('change', Post.previewImage);
    document.getElementById('post-btn').addEventListener("click", Post.addPost);

    onAuthStateChanged(auth, (user) => {
      if (user) {
        Post.fetchAndDisplayPosts(user);
      }
    });

    document.getElementById('post-filter').addEventListener('change', (event) => {
      onAuthStateChanged(auth, (user) => {
        if (user) {
          Post.fetchAndDisplayPosts(user, event.target.value);
          Post.setupListeners(user);
        }
      });
    });
  }

  static async fetchAndDisplayPosts(user, filter = 'all') {
    const usersRef = ref(db, 'users');
    allPosts = [];
    addedPostIds = new Set();

    const usersSnapshot = await get(usersRef);
    if (usersSnapshot.exists()) {
      const usersData = usersSnapshot.val();
      for (const userId in usersData) {
        if (usersData.hasOwnProperty(userId)) {
          const postsRef = ref(db, `users/${userId}/posts`);
          const postsSnapshot = await get(postsRef);
          if (postsSnapshot.exists()) {
            const postsData = postsSnapshot.val();
            for (const postId in postsData) {
              if (postsData.hasOwnProperty(postId) && !addedPostIds.has(postId)) {
                addedPostIds.add(postId);
                allPosts.push({ userId, postId, post: postsData[postId] });
              }
            }
          }
        }
      }
    }
    Post.renderPosts(allPosts, user.uid, filter);
  }

  static renderPosts(posts, currentUserId, filter) {
    const postsContainer = document.getElementById('personal-container');
    postsContainer.innerHTML = '';

    posts.sort((a, b) => a.postId.localeCompare(b.postId));

    const filteredPosts = filter === 'personal' ? posts.filter(post => post.userId === currentUserId) : posts;

    filteredPosts.forEach(({ postId, post, userId }) => {
      Post.addPostToDOM(postId, post.title, post.content, post.image, userId, currentUserId);
    });
  }

  static showPostElements() {
    document.getElementById('title-input').style.display = 'block';
    document.getElementById('close').style.display = 'block';
    document.getElementById('post-btn').style.display = 'block';
    document.getElementById('file').style.display = 'block';
  }

  static hidePostElements() {
    document.getElementById('title-input').style.display = 'none';
    document.getElementById('request-textarea').style.height = '6rem';
    document.getElementById('close').style.display = 'none';
    document.getElementById('file').style.display = 'none';
    document.getElementById('post-btn').style.display = 'none';
    document.getElementById('display-image').innerHTML = '';
    document.getElementById('display-image').style.display = 'none';
  }

  static previewImage(event) {
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
    const reqTitle = document.getElementById('title-input').value;
    const reqTxt = document.getElementById('request-textarea').value;

    if (!reqTitle.trim() || !reqTxt.trim()) {
      alert("Title and content are required.");
      return;
    }

    onAuthStateChanged(auth, (user) => {
      if (user) {
        Post.savePost(user.uid);
      } else {
        console.log("User is not logged in");
      }
    });
  }

  static savePost(userId) {
    const reqTitle = document.getElementById('title-input').value;
    const reqTxt = document.getElementById('request-textarea').value;
    const imgElement = document.getElementById('display-image').querySelector('img');
    const imgSrc = imgElement ? imgElement.src : '';

    const postId = Date.now().toString();
    const createdAt = new Date().toISOString(); // Ensure this is correctly formatted

    get(ref(db, `users/${userId}`)).then((snapshot) => {
      if (snapshot.exists()) {
        const userInfo = snapshot.val();
        set(ref(db, `users/${userId}/posts/${postId}`), {
          userId: userId,
          firstName: userInfo.firstName,
          lastName: userInfo.lastName,
          title: reqTitle,
          content: reqTxt,
          image: imgSrc,
          createdAt: createdAt // Ensure this is correctly stored
        })
          .then(() => {
            alert("Data Added Successfully");
            document.getElementById('title-input').value = "";
            document.getElementById('request-textarea').value = "";
            if (imgElement) {
              imgElement.remove();
            }

            Post.hidePostElements();

            // Add the post to DOM immediately
            Post.addPostToDOM(postId, reqTitle, reqTxt, imgSrc, userId, userId, createdAt);

          })
          .catch((error) => {
            console.error("Error saving post:", error);
            alert("Unsuccessful: " + error.message);
          });
      } else {
        console.log("No user data available");
      }
    }).catch((error) => {
      console.error(error);
    });
  }

  static addPostToDOM(postId, title, content, image, userId, currentUserId, createdAt) {
    const prefixedPostId = `post-${postId}`;
    if (document.getElementById(prefixedPostId)) {
      // If the post already exists in the DOM, do not add it again
      return;
    }

    get(ref(db, `users/${userId}`)).then((snapshot) => {
      if (snapshot.exists()) {
        const userInfo = snapshot.val();
        const fullName = `${userInfo.firstName} ${userInfo.lastName}`;

        const outerDiv = document.createElement("div");
        outerDiv.classList.add("outer-post");
        outerDiv.id = prefixedPostId;

        const postDiv = document.createElement("div");
        postDiv.classList.add("user-posts");

        const titlePost = document.createElement("h1");
        titlePost.innerText = title;

        const newPost = document.createElement("p");
        newPost.classList.add("content");
        newPost.innerText = content;

        const objContainer = document.createElement("div");
        objContainer.classList.add("userid-container");

        const postInfoContainer = document.createElement("div");
        postInfoContainer.classList.add("post-info-container");

        const dateElement = document.createElement("p");
        const date = new Date(createdAt);
        if (!isNaN(date)) {
          dateElement.innerText = `Date: ${date.toLocaleDateString()}`;
        } else {
          dateElement.innerText = "Date: Invalid Date";
        }
        dateElement.classList.add("post-date"); // Add a class for styling if needed

        const userIdElement = document.createElement("p");
        userIdElement.innerText = `Posted by: ${fullName}`;

        postInfoContainer.appendChild(dateElement);
        postInfoContainer.appendChild(userIdElement);

        objContainer.appendChild(postInfoContainer);

        const commentButton = document.createElement("button");
        commentButton.innerHTML = '<i class="ri-chat-4-line"></i>';
        commentButton.classList.add("comment-btn");

        postDiv.appendChild(titlePost);
        postDiv.appendChild(newPost);
        if (image) {
          const postImg = document.createElement('img');
          postImg.src = image;
          postImg.style.maxWidth = '100%';
          postDiv.appendChild(postImg);
        }
        postDiv.appendChild(objContainer);
        outerDiv.appendChild(postDiv);
        objContainer.appendChild(commentButton);

        if (userId === currentUserId) {
          const buttonGroup = document.createElement("div");
          buttonGroup.classList.add("button-group");

          const completeButton = document.createElement("button");
          completeButton.innerText = "Complete";
          completeButton.classList.add("complete-btn");

          const raiseButton = document.createElement("button");
          raiseButton.innerText = "Raise";
          raiseButton.classList.add("raise-btn");

          raiseButton.addEventListener('click', () => {
            Post.raisePost(userId, postId);
          });

          completeButton.addEventListener('click', () => {
            Post.showLikesModal(postId, userId);
          });

          const editButton = document.createElement("button");
          editButton.innerText = "Edit";
          editButton.classList.add("edit-btn");

          editButton.addEventListener('click', () => {
            if (editButton.innerText === "Edit") {
              Post.editPost(prefixedPostId, title, content, image, userId, editButton, completeButton);
              editButton.innerText = "Cancel";
            } else {
              Post.cancelEditPost(prefixedPostId, title, content, image, userId, currentUserId);
              editButton.innerText = "Edit";
            }
          });
          buttonGroup.appendChild(editButton);
          buttonGroup.appendChild(raiseButton);
          buttonGroup.appendChild(completeButton);
          outerDiv.appendChild(buttonGroup);
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
            commentsSection = document.createElement('div');
            commentsSection.classList.add('comments-section');
            postDiv.appendChild(commentsSection);

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
                Post.saveComment(userId, postId, commentContent);
                commentInput.value = '';
              }
            });

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

  static updatePostInDOM(postId, title, content, image, userId) {
    const prefixedPostId = `post-${postId}`;
    const postElement = document.getElementById(prefixedPostId);
    if (postElement) {
      const postDiv = postElement.querySelector(".user-posts");
      const titleElement = postDiv.querySelector("h1");
      const contentElement = postDiv.querySelector(".content");
      const imgElement = postDiv.querySelector("img");

      if (titleElement) titleElement.innerText = title;
      if (contentElement) contentElement.innerText = content;

      if (image) {
        if (imgElement) {
          imgElement.src = image;
        } else {
          const newImgElement = document.createElement("img");
          newImgElement.src = image;
          newImgElement.style.maxWidth = '100%';
          postDiv.appendChild(newImgElement);
        }
      } else if (imgElement) {
        imgElement.remove();
      }
    } else {
      console.log("Post element not found in the DOM");
    }
  }

  static editPost(prefixedPostId, title, content, image, userId, editButton, completeButton) {
    const outerDiv = document.getElementById(prefixedPostId);
    const postDiv = outerDiv.querySelector(".user-posts");

    const originalTitle = title;
    const originalContent = content;
    const originalImage = image;

    postDiv.innerHTML = '';
    completeButton.style.display = 'none';

    const titleInput = document.createElement('input');
    titleInput.type = 'text';
    titleInput.value = title;
    titleInput.classList.add('title-edit');

    const contentTextarea = document.createElement('textarea');
    contentTextarea.value = content;
    contentTextarea.classList.add('content-edit');

    const imageInput = document.createElement('input');
    imageInput.type = 'file';
    imageInput.classList.add('image-edit');
    imageInput.id = 'file-input';
    imageInput.style.display = 'none';

    const label = document.createElement('label');
    label.setAttribute('for', 'file-input');
    label.innerHTML = '<i id="file" class="bx bxs-photo-album" style="cursor: pointer;"></i>';

    const imageEditContainer = document.createElement('div');
    imageEditContainer.id = 'image-edit';
    imageEditContainer.appendChild(imageInput);
    imageEditContainer.appendChild(label);

    let imagePreview;
    let removeImageButton;
    let imageRemoved = false;

    const displayImagePreview = (src) => {
      if (imagePreview) {
        imagePreview.src = src;
      } else {
        imagePreview = document.createElement('img');
        imagePreview.src = src;
        imagePreview.style.maxWidth = '100%';
        postDiv.appendChild(imagePreview);
      }

      if (!removeImageButton) {
        removeImageButton = document.createElement('button');
        removeImageButton.innerHTML = '<i class="ri-delete-bin-line"></i>';
        removeImageButton.classList.add('remove-image-btn');
        removeImageButton.style.float = 'right';
        removeImageButton.addEventListener('click', () => {
          imagePreview.remove();
          removeImageButton.remove();
          imagePreview = null;
          removeImageButton = null;
          imageRemoved = true;
        });
        postDiv.appendChild(removeImageButton);
      }
    };

    if (image) {
      displayImagePreview(image);
    }

    imageInput.addEventListener('change', (event) => {
      const file = event.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          displayImagePreview(e.target.result);
          imageRemoved = false;
        };
        reader.readAsDataURL(file);
      }
    });

    const saveButton = document.createElement('button');
    saveButton.innerText = 'Save';
    saveButton.classList.add('save-edit-btn');

    saveButton.addEventListener('click', () => {
      const newTitle = titleInput.value.trim();
      const newContent = contentTextarea.value.trim();
      const newImage = (imagePreview && !imageRemoved) ? imagePreview.src : null;

      if (newTitle && newContent) {
        const postId = prefixedPostId.replace('post-', '');
        Post.saveEditedPost(postId, newTitle, newContent, newImage, userId);
      } else {
        alert('Title and content cannot be empty');
      }
    });

    const adjustTextareaHeight = (textarea, maxHeight = 500) => {
      textarea.style.height = 'auto';
      let newHeight = textarea.scrollHeight;

      if (newHeight > maxHeight) {
        newHeight = maxHeight;
        textarea.style.overflowY = 'auto';
      } else {
        textarea.style.overflowY = 'hidden';
      }

      textarea.style.height = `${newHeight}px`;
    };

    adjustTextareaHeight(contentTextarea);

    contentTextarea.addEventListener('focus', () => adjustTextareaHeight(contentTextarea));

    postDiv.appendChild(titleInput);
    postDiv.appendChild(contentTextarea);
    postDiv.appendChild(imageEditContainer);
    if (imagePreview) {
      postDiv.appendChild(imagePreview);
    }
    if (removeImageButton) {
      postDiv.appendChild(removeImageButton);
    }
    postDiv.appendChild(saveButton);

    editButton.innerText = "Cancel";
    editButton.removeEventListener('click', Post.editPost);
    editButton.addEventListener('click', () => {
      Post.cancelEditPost(prefixedPostId, originalTitle, originalContent, originalImage, userId, auth.currentUser.uid);
    });
  }

  static cancelEditPost(prefixedPostId, originalTitle, originalContent, originalImage, userId, currentUserId) {
    const postId = prefixedPostId.replace('post-', ''); // Extract postId
    get(ref(db, `users/${userId}`)).then((snapshot) => {
      if (snapshot.exists()) {
        const userInfo = snapshot.val();
        const fullName = `${userInfo.firstName} ${userInfo.lastName}`;

        const postDiv = document.getElementById(prefixedPostId).querySelector(".user-posts");
        postDiv.innerHTML = '';

        const titlePost = document.createElement("h1");
        titlePost.innerText = originalTitle;

        const newPost = document.createElement("p");
        newPost.classList.add("content");
        newPost.innerText = originalContent;

        const userIdElement = document.createElement("p");
        userIdElement.innerText = `Posted by: ${fullName}`;

        const objContainer = document.createElement("div");
        objContainer.classList.add("userid-container");
        postDiv.appendChild(titlePost);
        postDiv.appendChild(newPost);

        if (originalImage) {
          const postImg = document.createElement('img');
          postImg.src = originalImage;
          postImg.style.maxWidth = '100%';
          postDiv.appendChild(postImg);
        }

        postDiv.appendChild(objContainer);
        objContainer.appendChild(userIdElement);

        const commentButton = document.createElement("button");
        commentButton.innerHTML = '<i class="ri-chat-4-line"></i>';
        commentButton.classList.add("comment-btn");
        objContainer.appendChild(commentButton);

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
                Post.saveComment(userId, postId, commentContent);
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

        if (userId === currentUserId) {
          const existingCompleteButton = document.querySelector(`#${prefixedPostId} .complete-btn`);
          const existingEditButton = document.querySelector(`#${prefixedPostId} .edit-btn`);
          const existingRaiseButton = document.querySelector(`#${prefixedPostId} .raise-btn`);
          if (existingCompleteButton) existingCompleteButton.remove();
          if (existingEditButton) existingEditButton.remove();
          if (existingRaiseButton) existingRaiseButton.remove();

          const completeButton = document.createElement("button");
          completeButton.innerText = "Complete";
          completeButton.classList.add("complete-btn");

          completeButton.addEventListener('click', () => {
            Post.showLikesModal(postId, userId);
          });

          const raiseButton = document.createElement("button");
          raiseButton.innerText = "Raise";
          raiseButton.classList.add("raise-btn");

          raiseButton.addEventListener('click', () => {
            Post.raisePost(userId, postId);
          });

          const editButton = document.createElement("button");
          editButton.innerText = "Edit";
          editButton.classList.add("edit-btn");

          editButton.addEventListener('click', () => {
            Post.editPost(prefixedPostId, originalTitle, originalContent, originalImage, userId, editButton, completeButton);
          });

          const outerDiv = document.getElementById(prefixedPostId);
          const buttonGroup = outerDiv.querySelector(".button-group");
          buttonGroup.appendChild(editButton);
          buttonGroup.appendChild(raiseButton);
          buttonGroup.appendChild(completeButton);
          outerDiv.appendChild(buttonGroup);
        }
      } else {
        console.log("No user data available");
      }
    }).catch((error) => {
      console.error(error);
    });
  }

  static saveEditedPost(postId, newTitle, newContent, newImage, userId) {
    onAuthStateChanged(auth, (user) => {
      if (user && user.uid === userId) {
        const postRef = ref(db, `users/${userId}/posts/${postId}`);
        get(postRef).then((snapshot) => {
          if (snapshot.exists()) {
            const postData = snapshot.val();
            const updatedData = {
              ...postData,
              title: newTitle,
              content: newContent,
              image: newImage !== undefined ? newImage : postData.image, // Update only if newImage is not undefined
            };

            if (newImage === null) {
              delete updatedData.image; // Remove image key if newImage is null
            }

            set(postRef, updatedData)
              .then(() => {
                alert("Post updated successfully");

                // Ensure the element exists before proceeding
                const postElement = document.getElementById(`post-${postId}`);
                if (postElement) {
                  Post.cancelEditPost(`post-${postId}`, newTitle, newContent, updatedData.image, userId, auth.currentUser.uid);
                } else {
                  console.error("Post element not found in the DOM");
                }
              })
              .catch((error) => {
                console.error("Error updating post:", error);
              });
          } else {
            console.error("Post not found.");
          }
        }).catch((error) => {
          console.error("Error fetching post data:", error);
        });
      } else {
        alert("You are not authorized to edit this post.");
      }
    });
  }

  static deletePost(userId, postId) {
    onAuthStateChanged(auth, (user) => {
      if (user && user.uid === userId) {
        remove(ref(db, `users/${userId}/posts/${postId}`))
          .then(() => {
            const postElement = document.getElementById(`post-${postId}`);
            if (postElement) {
              postElement.remove();
              console.log("Post deleted successfully");
            } else {
              console.log("Post element not found in the DOM");
            }
          })
          .catch((error) => {
            console.error("Error deleting post:", error);
          });
      } else {
        alert("You can only delete your own posts.");
      }
    });
  }

  static raisePost(userId, postId) {
    const postRef = ref(db, `users/${userId}/posts/${postId}`);

    if (ongoingPostOperations.has(postId)) {
      return; // Prevent multiple operations on the same post
    }
    ongoingPostOperations.add(postId);

    get(postRef).then((snapshot) => {
      if (snapshot.exists()) {
        const postData = snapshot.val();

        // First, remove the original post from the database
        remove(postRef).then(() => {
          // After the original post is removed, remove it from the DOM
          const oldPostElement = document.getElementById(`post-${postId}`);
          if (oldPostElement) {
            oldPostElement.remove();
          }

          // Create a new post with the same data
          const newPostId = Date.now().toString();
          set(ref(db, `users/${userId}/posts/${newPostId}`), {
            userId: postData.userId,
            firstName: postData.firstName,
            lastName: postData.lastName,
            title: postData.title,
            content: postData.content,
            image: postData.image,
            createdAt: new Date().toISOString()
          })
            .then(() => {
              alert("Post raised successfully");
              // Ensure the new post is added to the DOM
              Post.addPostToDOM(newPostId, postData.title, postData.content, postData.image, userId, userId, postData.createdAt);
              ongoingPostOperations.delete(postId); // Remove from tracking set
            })
            .catch((error) => {
              console.error("Error creating new post:", error);
              ongoingPostOperations.delete(postId); // Remove from tracking set even on error
            });
        }).catch((error) => {
          console.error("Error removing original post:", error);
          ongoingPostOperations.delete(postId); // Remove from tracking set even on error
        });
      } else {
        console.log("Post data not found");
        ongoingPostOperations.delete(postId); // Remove from tracking set even on not found
      }
    }).catch((error) => {
      console.error("Error fetching post data:", error);
      ongoingPostOperations.delete(postId); // Remove from tracking set even on error
    });
  }

  static saveComment(postOwnerId, postId, commentContent) {
    const commentId = Date.now().toString();

    onAuthStateChanged(auth, (user) => {
      if (user) {
        get(ref(db, `users/${user.uid}`)).then((snapshot) => {
          if (snapshot.exists()) {
            const userInfo = snapshot.val();
            const fullName = `${userInfo.firstName} ${userInfo.lastName}`;

            const commentData = {
              userId: user.uid,
              content: commentContent,
              fullName: fullName,
              timestamp: Date.now()
            };

            set(ref(db, `users/${postOwnerId}/posts/${postId}/comments/${commentId}`), commentData)
              .then(() => {
                console.log("Comment saved successfully");
                Post.notifyUsers(postOwnerId, postId, fullName, user.uid);

                // Display the comment immediately
                const commentsSection = document.getElementById(`post-${postId}`).querySelector('.comments-section');
                if (commentsSection) {
                  Post.displayComment({ ...commentData, postId, commentId }, commentsSection);
                }
              })
              .catch((error) => {
                console.error("Error saving comment:", error);
              });
          } else {
            console.log("No user data available");
          }
        }).catch((error) => {
          console.error(error);
        });
      }
    });
  }

  static notifyUsers(postOwnerId, postId, commenterName, commenterId) {
    // Notify post owner if a new comment is added to their post
    get(ref(db, `users/${postOwnerId}/posts/${postId}`)).then((snapshot) => {
      if (snapshot.exists()) {
        const postData = snapshot.val();
        const postTitle = postData.title;
  
        if (postOwnerId !== commenterId) {
          // Notify post owner
          const notificationId = Date.now().toString();
          set(ref(db, `users/${postOwnerId}/notifications/${notificationId}`), {
            message: `${commenterName} commented on your post: ${postTitle}`,
            postId: postId,
            timestamp: Date.now()
          });
        }
  
        // Notify other commenters on the post
        get(ref(db, `users/${postOwnerId}/posts/${postId}/comments`)).then((commentsSnapshot) => {
          if (commentsSnapshot.exists()) {
            commentsSnapshot.forEach((commentSnapshot) => {
              const commentData = commentSnapshot.val();
              if (commentData.userId !== commenterId && commentData.userId !== postOwnerId) {
                const notificationId = Date.now().toString();
                set(ref(db, `users/${commentData.userId}/notifications/${notificationId}`), {
                  message: `${commenterName} also commented on the post: ${postTitle}`,
                  postId: postId,
                  timestamp: Date.now()
                });
              }
            });
          }
        }).catch((error) => {
          console.error("Error fetching comments for notification:", error);
        });
      }
    }).catch((error) => {
      console.error("Error fetching post data for notification:", error);
    });
  }

  static displayComment(comment, commentsSection) {
    const commentContainer = document.createElement('div');
    commentContainer.classList.add('comment-container');

    const commentElement = document.createElement('div');
    commentElement.classList.add('comment');
    commentElement.innerHTML = `<strong>${comment.fullName}</strong> ${comment.content}`;

    commentContainer.appendChild(commentElement);

    // Add a delete button if the comment belongs to the current user
    if (comment.userId === auth.currentUser.uid) {
      const deleteButton = document.createElement('button');
      deleteButton.innerHTML = '<i class="ri-delete-bin-line"></i>';
      deleteButton.classList.add('delete-comment-btn');
      deleteButton.addEventListener('click', () => {
        Post.deleteComment(comment.userId, comment.postId, comment.commentId, commentContainer);
      });
      commentContainer.appendChild(deleteButton);
    }

    commentsSection.appendChild(commentContainer);
  }

  static deleteComment(userId, postId, commentId, commentElement) {
    onAuthStateChanged(auth, (user) => {
      if (user && user.uid === userId) {
        const commentRef = ref(db, `users/${userId}/posts/${postId}/comments/${commentId}`);
        remove(commentRef)
          .then(() => {
            commentElement.remove();
            console.log("Comment deleted successfully");
          })
          .catch((error) => {
            console.error("Error deleting comment:", error);
          });
      } else {
        alert("You can only delete your own comments.");
      }
    });
  }

  static loadComments(userId, postId, commentsSection) {
    const commentsRef = ref(db, `users/${userId}/posts/${postId}/comments`);
    commentsSection.innerHTML = ''; // Clear existing comments

    get(commentsRef).then((snapshot) => {
      if (snapshot.exists()) {
        const commentsData = snapshot.val();
        for (const commentId in commentsData) {
          if (commentsData.hasOwnProperty(commentId)) {
            const comment = commentsData[commentId];
            comment.postId = postId; // Add postId to comment object for deletion
            comment.commentId = commentId; // Add commentId to comment object for deletion
            Post.displayComment(comment, commentsSection);
          }
        }
      }
    }).catch((error) => {
      console.error("Error loading comments:", error);
    });
  }

  static showLikesModal(postId, userId) {
    const modal = document.getElementById('likesModal');
    const commentersList = document.getElementById('commenters-list');
    commentersList.innerHTML = '';

    const commentsRef = ref(db, `users/${userId}/posts/${postId}/comments`);
    const uniqueUserIds = new Set();

    get(commentsRef).then((snapshot) => {
      if (snapshot.exists()) {
        snapshot.forEach((childSnapshot) => {
          const comment = childSnapshot.val();
          if (comment.userId !== auth.currentUser.uid) {
            if (!uniqueUserIds.has(comment.userId)) {
              uniqueUserIds.add(comment.userId);
              const commenterDiv = document.createElement('div');
              commenterDiv.classList.add('commenter-item'); // Add new class here
              commenterDiv.innerHTML = `
                <label>
                  <input type="checkbox" value="${comment.userId}">${comment.fullName}
                </label>
              `;
              commentersList.appendChild(commenterDiv);
            }
          }
        });

        if (uniqueUserIds.size === 0) {
          Post.deletePost(userId, postId);
          return;
        }

        modal.style.display = 'block';
      } else {
        Post.deletePost(userId, postId);
      }
    }).catch((error) => {
      console.error(error);
    });

    modal.dataset.postId = postId;
    modal.dataset.userId = userId;
  }

  static saveLikes() {
    const modal = document.getElementById('likesModal');
    const postId = modal.dataset.postId;
    const userId = modal.dataset.userId;
    const checkboxes = document.querySelectorAll('#commenters-list input[type="checkbox"]:checked');

    // Check if the only commenter is the user themselves or if there are no comments
    const hasOtherComments = Array.from(checkboxes).some(checkbox => checkbox.value !== auth.currentUser.uid);

    if (!hasOtherComments) {
      alert("No other users have commented or only you have commented. The post will be deleted.");
      modal.style.display = 'none';
      Post.deletePost(userId, postId);
      return;
    }

    // Process likes for other users' comments
    checkboxes.forEach((checkbox) => {
      const likedUserId = checkbox.value;
      if (likedUserId !== auth.currentUser.uid) {
        const likesRef = ref(db, `users/${likedUserId}/likes`);
        const numLikesRef = ref(db, `users/${likedUserId}/numLikes`);

        get(numLikesRef).then((snapshot) => {
          let currentNumLikes = snapshot.val() || 0;

          const newNumLikes = currentNumLikes + 1;

          push(likesRef, {
            postId: postId,
            likedBy: userId,
            timestamp: Date.now(),
          }).then(() => {
            set(numLikesRef, newNumLikes).catch((error) => {
              console.error("Error updating number of likes:", error);
            });
          }).catch((error) => {
            console.error("Error saving like details:", error);
          });
        }).catch((error) => {
          console.error("Error fetching number of likes:", error);
        });
      }
    });

    modal.style.display = 'none';
    Post.deletePost(userId, postId);
  }

  static closeModal() {
    const modal = document.getElementById('likesModal');
    modal.style.display = 'none';
  }
}

document.addEventListener('DOMContentLoaded', () => {
  Auth.init();
  Post.init();
  setupPostListeners();
  setupNotificationListeners();

  // Toggle notification container visibility on notification icon click
  const notificationIcon = document.getElementById('notification-icon');
  const notificationContainer = document.getElementById('notification-container');

  notificationIcon.addEventListener('click', () => {
    if (notificationContainer.style.display === 'none' || !notificationContainer.style.display) {
      notificationContainer.style.display = 'block';
    } else {
      notificationContainer.style.display = 'none';
    }
  });

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
