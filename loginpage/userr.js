function formatPhoneNumber(event) {
    // Get the input value and remove any non-numeric characters
    let input = event.target.value.replace(/\D/g, ' '); // /\D/g - detects char // char gets replaced by  ' '(null)
    
    // Initialize the formatted input
    let formattedInput = '';

    // Format the phone number as the user types
    if (input.length > 0) {
        formattedInput += input.substring(0, Math.min(4, input.length)); // Add the first 1-4 digits
    }
    if (input.length > 4) {
        formattedInput += '-' + input.substring(4, Math.min(7, input.length)); // Add the next 3 digits with a hyphen
    }
    if (input.length > 7) {
        formattedInput += '-' + input.substring(7, 11); // Add the remaining digits with a hyphen
    }

    // Update the input field value with the formatted phone number
    event.target.value = formattedInput;
}
 