document.addEventListener('DOMContentLoaded', () => {
  let UserCreds = JSON.parse(sessionStorage.getItem("user-creds"));
  let UserInfo = JSON.parse(sessionStorage.getItem("user-info"));

  let MsgHead = document.getElementById('msg');
  let GreetHead = document.getElementById('greet');
  let SignoutBtn = document.getElementById('signoutbtn');

  let Signout = () => {
      sessionStorage.removeItem("user-creds");
      sessionStorage.removeItem("user-info");
      window.location.href = '../loginpage/login.html';
  }

let CheckCred = () => {
      if (!sessionStorage.getItem("user-creds")) {
          window.location.href = '../loginpage/login.html';
      } 
      
  /**    else {
          MsgHead.innerText = `User with email "${UserCreds.email}" logged in`;
          GreetHead.innerText = `Welcome "${UserInfo.firstName} ${UserInfo.lastName}!"`;
      } **/
  } 

  window.addEventListener('DOMContentLoaded', CheckCred);
  SignoutBtn.addEventListener('click', Signout);

  document.getElementById('request-textarea').addEventListener('focus', () => {
      document.getElementById('title-input').style.display = 'block';
      document.getElementById('close').style.display = 'block';
      document.getElementById('post-btn').style.display = 'block';
  });

  document.getElementById('close').addEventListener('click', () => {
      const titleInput = document.getElementById('title-input');
      titleInput.style.display = 'none';
      document.getElementById('request-textarea').style.height = '6rem';
      document.getElementById('close').style.display = 'none';
      document.getElementById('file').style.marginBottom = '35px';
      document.getElementById('post-btn').style.display = 'none';
  });

  const requestTextarea = document.getElementById('request-textarea');
  requestTextarea.addEventListener('input', function () {
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

  const postInput = document.querySelector("#request-textarea");
  const postButton = document.querySelector("#post-btn");
  const personalContainer = document.querySelector("#personal-container");

  postButton.addEventListener("click", postBtn);

  function postBtn(event) {
      event.preventDefault();

      const PostDiv = document.createElement("div");
      PostDiv.classList.add("user-posts");

      const newPost = document.createElement("li");
      newPost.innerText = postInput.value;

      PostDiv.appendChild(newPost);

      saveLocal(postInput.value);

      postInput.value = "";

      personalContainer.appendChild(PostDiv);
  }

  function saveLocal(post) {
      let posts;
      if (localStorage.getItem('posts') === null) {
          posts = [];
      } else {
          posts = JSON.parse(localStorage.getItem('posts'));
      }
      posts.push(post);
      localStorage.setItem('posts', JSON.stringify(posts));
  }
});