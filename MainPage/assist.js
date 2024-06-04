// Show the title input when the textarea is focused
document.getElementById('request-textarea').addEventListener('focus', () => {
    document.getElementById('title-input').style.display = 'block';
    document.getElementById('close').style.display = 'block';
});



// Toggle the visibility of the title input when clicking the close button
document.getElementById('close').addEventListener('click', () => {
    const titleInput = document.getElementById('title-input');
    titleInput.style.display = titleInput.style.display === 'none' ? 'block' : 'none';
    document.getElementById('close').style.display = 'none';

});