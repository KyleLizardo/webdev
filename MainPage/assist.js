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

// Auth class for handling authentication-related functionality
class Auth {
  static init() {
    window.addEventListener('DOMContentLoaded', Auth.checkCredentials);
    document.querySelector('.signoutbtn').addEventListener('click', Auth.signOut); // <-for class ->  for id  document.getElementById('signoutbtn').addEventListener('click', Auth.signOut);
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

// Post class for handling post-related functionality
class Post {
  static init() {
    document.getElementById('request-textarea').addEventListener('focus', Post.showPostElements);
    document.getElementById('close').addEventListener('click', Post.hidePostElements);
    document.getElementById('firstimg').addEventListener('change', Post.previewImage);
    document.getElementById('post-btn').addEventListener("click", Post.addPost);

    onAuthStateChanged(auth, (user) => {
      if (user) {
        const usersRef = ref(db, 'users');
        onChildAdded(usersRef, (snapshot) => {
          const userId = snapshot.key;
          const postsRef = ref(db, `users/${userId}/posts`);

          onChildAdded(postsRef, (snapshot) => {
            const post = snapshot.val();
            const postId = snapshot.key;
            if (!document.getElementById(`post-${postId}`)) {
              Post.addPostToDOM(postId, post.title, post.content, post.image, userId, user.uid);
            }
          });

          onChildRemoved(postsRef, (snapshot) => {
            const postId = snapshot.key;
            const postElement = document.getElementById(`post-${postId}`);
            if (postElement) {
              postElement.remove();
            }
          });

          // Listen for changes to posts
          onChildChanged(postsRef, (snapshot) => {
            const post = snapshot.val();
            const postId = snapshot.key;
            Post.updatePostInDOM(postId, post.title, post.content, post.image, userId);
          });
        });
      }
    });

    document.getElementById('saveLikesBtn').addEventListener('click', Post.saveLikes);
    document.querySelector('.modal .close').addEventListener('click', Post.closeModal);
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
            document.getElementById('title-input').value = "";
            document.getElementById('request-textarea').value = "";
            if (imgElement) {
                imgElement.remove();
            }

            Post.hidePostElements();

          })
          .catch((error) => {
            console.error("Error saving post:", error);
            alert("Unsuccessful: " + error.message);
          });

        Post.hidePostElements();
      } else {
        console.log("No user data available");
      }
      
    }).catch((error) => {
      console.error(error);
    });
  }

  static addPostToDOM(postId, title, content, image, userId, currentUserId) {
    const prefixedPostId = `post-${postId}`;
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

            if (userId === currentUserId) {
                const completeButton = document.createElement("button");
                completeButton.innerText = "Complete";
                completeButton.classList.add("complete-btn");

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

                outerDiv.appendChild(completeButton);
                outerDiv.appendChild(editButton);
            }

            // Ensure the latest post is added to the top
            const personalContainer = document.getElementById('personal-container');
            if (personalContainer.firstChild) {
                personalContainer.insertBefore(outerDiv, personalContainer.firstChild);
            } else {
                personalContainer.appendChild(outerDiv);
            }

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

    if (image) {
      imagePreview = document.createElement('img');
      imagePreview.src = image;
      imagePreview.style.maxWidth = '100%';

      removeImageButton = document.createElement('button');
      removeImageButton.innerText = 'Remove Image';
      removeImageButton.classList.add('remove-image-btn');
      removeImageButton.addEventListener('click', () => {
        imagePreview.remove();
        removeImageButton.remove();
        imageRemoved = true;
      });

      postDiv.appendChild(removeImageButton);
      postDiv.appendChild(imagePreview);
    }

    imageInput.addEventListener('change', (event) => {
      if (!imagePreview) {
        imagePreview = document.createElement('img');
        imagePreview.style.maxWidth = '100%';
        postDiv.appendChild(imagePreview);
      }
      if (removeImageButton) {
        removeImageButton.remove();
      }

      const file = event.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          imagePreview.src = e.target.result;
          imagePreview.dataset.newImage = true;
        };
        reader.readAsDataURL(file);

        removeImageButton = document.createElement('button');
        removeImageButton.innerText = 'Remove Image';
        removeImageButton.classList.add('remove-image-btn');
        removeImageButton.addEventListener('click', () => {
          imagePreview.remove();
          removeImageButton.remove();
          imageRemoved = true;
        });

        postDiv.insertBefore(removeImageButton, imagePreview);
      }
    });

    const saveButton = document.createElement('button');
    saveButton.innerText = 'Save';
    saveButton.classList.add('save-edit-btn');

    saveButton.addEventListener('click', () => {
      const newTitle = titleInput.value.trim();
      const newContent = contentTextarea.value.trim();
      const newImage = (imagePreview && imagePreview.dataset.newImage) ? imagePreview.src : (imageRemoved ? null : image);

      if (newTitle && newContent) {
        const postId = prefixedPostId.replace('post-', ''); // Extract postId
        Post.saveEditedPost(postId, newTitle, newContent, newImage, userId);
      } else {
        alert('Title and content cannot be empty');
      }
    });

    postDiv.appendChild(titleInput);
    postDiv.appendChild(contentTextarea);
    postDiv.appendChild(imageEditContainer);
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

        if (userId === currentUserId) {
          const existingCompleteButton = document.querySelector(`#${prefixedPostId} .complete-btn`);
          const existingEditButton = document.querySelector(`#${prefixedPostId} .edit-btn`);
          if (existingCompleteButton) existingCompleteButton.remove();
          if (existingEditButton) existingEditButton.remove();

          const completeButton = document.createElement("button");
          completeButton.innerText = "Complete";
          completeButton.classList.add("complete-btn");

          completeButton.addEventListener('click', () => {
            Post.showLikesModal(postId, userId);
          });

          const editButton = document.createElement("button");
          editButton.innerText = "Edit";
          editButton.classList.add("edit-btn");

          editButton.addEventListener('click', () => {
            Post.editPost(prefixedPostId, originalTitle, originalContent, originalImage, userId, editButton, completeButton);
          });

          const outerDiv = document.getElementById(prefixedPostId);
          outerDiv.appendChild(completeButton);
          outerDiv.appendChild(editButton);
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
              image: newImage || postData.image,
            };

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
  static saveComment(userId, postId, commentContent) {
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

            set(ref(db, `users/${userId}/posts/${postId}/comments/${commentId}`), commentData)
              .then(() => {
                console.log("Comment saved successfully");
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

  static showLikesModal(postId, userId) {
    const modal = document.getElementById('likesModal');
    const commentersList = document.getElementById('commenters-list');
    commentersList.innerHTML = '';
  
    const commentsRef = ref(db, `users/${userId}/posts/${postId}/comments`);
    const uniqueUserIds = new Set();
  
    get(commentsRef).then((snapshot) => {
      if (snapshot.exists()) {
        let hasOtherComments = false;
        snapshot.forEach((childSnapshot) => {
          const comment = childSnapshot.val();
          if (comment.userId !== auth.currentUser.uid) {
            uniqueUserIds.add(comment.userId);
            hasOtherComments = true;
            const commenterDiv = document.createElement('div');
            commenterDiv.innerHTML = `
              <label>
                <input type="checkbox" value="${comment.userId}">${comment.fullName}
              </label>
            `;
            commentersList.appendChild(commenterDiv);
          }
        });
  
        if (!hasOtherComments) {
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
  static saveLikes() {
    const modal = document.getElementById('likesModal');
    const postId = modal.dataset.postId;
    const userId = modal.dataset.userId;
    const checkboxes = document.querySelectorAll('#commenters-list input[type="checkbox"]:checked');
  

  
    // Check if the only commenter is the user themselves or if there are no comments
    const hasOtherComments = Array.from(checkboxes).some(checkbox => checkbox.value !== auth.currentUser.uid);
  

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
