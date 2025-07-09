// js/my-account.js
document.addEventListener('DOMContentLoaded', async () => {
  // Ensure user is logged in, redirect if not (optional, but good practice for an account page)
  try {
    const meResp = await fetch('/api/me', { credentials: 'include' });
    if (!meResp.ok) {
      // If no active session, redirect to login
      // window.location.href = 'auth.html';
      // For now, we'll allow access but features might not fully work without a backend
      console.warn('User not logged in or session expired. Profile saving may be limited to local changes.');
    } else {
      const { user } = await meResp.json();
      // Pre-fill display name if available from user object (e.g., from initial onboarding)
      if (user && user.display_name) {
        const displayNameInput = document.getElementById('displayNameInput');
        if (displayNameInput) {
          displayNameInput.value = user.display_name;
        }
      }
    }
  } catch (error) {
    console.error('Error checking login status:', error);
  }

  const myAccountForm = document.getElementById('myAccountForm');
  const displayNameInput = document.getElementById('displayNameInput');
  const profilePictureUpload = document.getElementById('profilePictureUpload');
  const profilePicturePreview = document.getElementById('profilePicturePreview');
  // const saveProfileButton = document.getElementById('saveProfileButton'); // The form's submit event is used

  // Load saved display name from localStorage on page load
  if (displayNameInput && localStorage.getItem('displayName')) {
    displayNameInput.value = localStorage.getItem('displayName');
  }

  // Preview profile picture
  if (profilePictureUpload && profilePicturePreview) {
    profilePictureUpload.addEventListener('change', function() {
      const file = this.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
          profilePicturePreview.src = e.target.result;
          profilePicturePreview.style.display = 'block';
        }
        reader.readAsDataURL(file);
      } else {
        profilePicturePreview.src = '#';
        profilePicturePreview.style.display = 'none';
      }
    });
  }

  // Handle form submission for saving profile data
  if (myAccountForm) {
    myAccountForm.addEventListener('submit', async (event) => {
      event.preventDefault(); // Prevent default form submission

      // Save display name to localStorage
      if (displayNameInput) {
        localStorage.setItem('displayName', displayNameInput.value);
        // alert('Display name saved locally!'); // Optional: provide user feedback
      }

      // --- Backend Integration (Conceptual) ---
      // The original js/onboard.js had a fetch call to /api/onboard.
      // For a "My Account" update, this would typically go to a different endpoint, e.g., /api/profile.
      // This part is commented out as it requires backend implementation.

      /*
      const formData = new FormData(myAccountForm); // Gathers display_name and profile_pic file
      // If you only want to send the display name and not always the picture:
      // const formData = new FormData();
      // formData.append('display_name', displayNameInput.value);
      // if (profilePictureUpload.files[0]) {
      //   formData.append('profile_pic', profilePictureUpload.files[0]);
      // }

      try {
        const response = await fetch('/api/profile', { // Assuming a new endpoint like /api/profile
          method: 'POST', // Or PUT
          credentials: 'include',
          body: formData, // FormData handles multipart/form-data for file uploads
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: 'Failed to save profile. Server error.' }));
          throw new Error(errorData.error || 'Failed to save profile.');
        }

        const result = await response.json();
        alert('Profile saved successfully!'); // Or update UI more subtly
        // Optionally, update display name in header if it shows there
        // if (window.loadHeader) window.loadHeader();
      } catch (error) {
        console.error('Error saving profile:', error);
        alert(`Error: ${error.message}`);
      }
      */

      // For now, just a simple confirmation that local save happened.
      // Remove the alert if it's annoying during development.
      if (displayNameInput.value) {
        alert('Profile settings (display name locally, picture previewed) processed!');
      } else {
        alert('Please enter a display name.');
      }

      // Potentially redirect or give other feedback
      // For example, if this page was part of an initial mandatory setup:
      // window.location.href = '/'; // Redirect to homepage
    });
  }

  // The old js/onboard.js had a check:
  // const resp = await fetch('/api/onboard', { credentials: 'include' });
  // const { onboarded } = await resp.json().catch(() => ({ onboarded: true }));
  // if (onboarded) return window.location.href = '/';
  // This logic might need to be re-evaluated for a "My Account" page.
  // An account page is usually accessible anytime, not just for initial onboarding.
  // So, the automatic redirect if "onboarded" is likely not needed here.
});
