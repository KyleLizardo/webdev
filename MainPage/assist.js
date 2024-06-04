

// Show the title input when the textarea is focused
document.getElementById('request-textarea').addEventListener('focus', () => {
    document.getElementById('title-input').style.display = 'block'; // Removed space between 9 and rem
    document.getElementById('close').style.display = 'block';


    this.style.overflow = 'hidden'; 

});


// Toggle the visibility of the title input when clicking the close button
document.getElementById('close').addEventListener('click', () => {
    const titleInput = document.getElementById('title-input');
    titleInput.style.display = titleInput.style.display === 'none' ? 'block' : 'none';
    document.getElementById('request-textarea').style.height = '6rem';
    document.getElementById('close').style.display = 'none';
    
    document.getElementById('file').style.marginBottom = '35px';

  

});

const requestTextarea = document.getElementById('request-textarea');

requestTextarea.addEventListener('input', function () {
    this.style.height = 'auto'; // Initially set height to auto
    this.style.overflow = 'hidden'; // Hide overflow initially
    const scrollHeight = this.scrollHeight; // Get the new scroll height
    const viewHeight = this.clientHeight; // Get the current displayed height
  
    this.style.height = `${scrollHeight}px`; // Set height based on content
  
    // Enable overflow only when scrollHeight reaches or exceeds 700px
    if (scrollHeight >= 500) {
      this.style.maxHeight = '500px'; // Set max height for restriction
      this.style.overflow = 'visible'; // Enable overflow
    } else {
      // Remove max height and overflow if content shrinks below 700px
      this.style.maxHeight = null;
      this.style.overflow = 'hidden';
    }
  });