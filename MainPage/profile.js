import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.1/firebase-app.js";
import { getDatabase, ref, get, update } from "https://www.gstatic.com/firebasejs/10.12.1/firebase-database.js";
import { getAuth, onAuthStateChanged, updatePassword, signOut } from "https://www.gstatic.com/firebasejs/10.12.1/firebase-auth.js";

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
const db = getDatabase(app);

const FnameInp = document.getElementById('fnameInp');
const LnameInp = document.getElementById('lnameInp');
const BdateInp = document.getElementById('bdateInp');
const GenderInp = document.getElementById('genderInp');
const ContactInp = document.getElementById('contactInp');
const EmailInp = document.getElementById('emailInp');
const PassInp = document.getElementById('passwordInp');
const ConfirmPassInp = document.getElementById('confirmPasswordInp');
const StreetInp = document.getElementById('streetInp');
const BrgyInp = document.getElementById('brgyInp');
const MunicipalityInp = document.getElementById('municipalityInp');
const ShowPasswordCheck = document.getElementById('showPasswordCheck');

class Auth {
  static init() {
    onAuthStateChanged(auth, (user) => {
      if (!user) {
        window.location.href = '../loginpage/login.html';
      } else {
        loadUserData(user);
      }
    });

    document.querySelector('.signoutbtn').addEventListener('click', Auth.signOut);
  }

  static signOut() {
    signOut(auth).then(() => {
      window.location.href = '../loginpage/login.html';
    }).catch((error) => {
      console.error('Error signing out:', error);
    });
  }
}

// Function to load the user data
const loadUserData = user => {
    const userRef = ref(db, 'users/' + user.uid);
    get(userRef).then(snapshot => {
        if (snapshot.exists()) {
            const data = snapshot.val();
            FnameInp.value = data.firstName || '';
            LnameInp.value = data.lastName || '';
            BdateInp.value = data.birthDate || '';
            GenderInp.value = data.gender || '';
            ContactInp.value = data.contact || '';
            EmailInp.value = data.email || '';
            StreetInp.value = data.street || '';
            BrgyInp.value = data.brgy || '';
            MunicipalityInp.value = data.municipality || '';
        } else {
            console.log('No data available');
        }
    }).catch(error => {
        console.error(error);
    });
};

// Function to handle form submission
const updateUserProfile = evt => {
    evt.preventDefault(); // Prevent any default behavior

    onAuthStateChanged(auth, user => {
        if (user) {
            const updates = {
                firstName: FnameInp.value,
                lastName: LnameInp.value,
                birthDate: BdateInp.value,
                gender: GenderInp.value,
                contact: ContactInp.value,
                street: StreetInp.value,
                brgy: BrgyInp.value,
                municipality: MunicipalityInp.value
            };

            const password = PassInp.value;
            const confirmPassword = ConfirmPassInp.value;

            const updateProfile = () => {
                const userRef = ref(db, 'users/' + user.uid);
                update(userRef, updates).then(() => {
                    alert('Profile updated successfully!');
                }).catch(error => {
                    console.error('Error updating profile: ', error);
                    alert('Error updating profile: ' + error.message);
                });
            };

            if (password && confirmPassword) {
                if (password === confirmPassword) {
                    updatePassword(user, password).then(() => {
                        alert('Password updated successfully!');
                        updateProfile();
                    }).catch(error => {
                        console.error('Error updating password: ', error);
                        alert('Error updating password: ' + error.message);
                    });
                } else {
                    alert('Passwords do not match!');
                }
            } else {
                updateProfile();
            }
        }
    });
};

// Add event listener to the form id - ProfileForm
document.getElementById('ProfileForm').addEventListener('submit', updateUserProfile);
document.getElementById('AddressForm').addEventListener('submit', updateUserProfile);

// Toggle password visibility
ShowPasswordCheck.addEventListener('change', () => {
    const type = ShowPasswordCheck.checked ? 'text' : 'password';
    PassInp.type = type;
    ConfirmPassInp.type = type;
});

// Initialize authentication and user data loading
Auth.init();
