// js/my-account.js
document.addEventListener('DOMContentLoaded', async () => {
  const displayNameInput = document.getElementById('displayNameInput');
  const profilePictureUpload = document.getElementById('profilePictureUpload');
  const profilePicturePreview = document.getElementById('profilePicturePreview');
  const myAccountForm = document.getElementById('myAccountForm');

  // Fetch user data and pre-fill form
  try {
    const meResp = await fetch('/api/me', { credentials: 'include' });
    if (!meResp.ok) {
      console.warn('User not logged in or session expired. Redirecting to login.');
      // window.location.href = 'auth.html'; // Optional: redirect if not logged in
      // For now, proceed but functionality might be limited
      if (meResp.status === 401 && window.location.pathname !== '/auth.html') {
        // More specific redirect if not on auth page already
        // window.location.href = `auth.html?redirect=${encodeURIComponent(window.location.pathname)}`;
      }
      // Fallback to localStorage if API fails but there's local data (e.g. offline or simple demo)
      if (displayNameInput && localStorage.getItem('displayName')) {
        displayNameInput.value = localStorage.getItem('displayName');
      }
      // No profile pic from local storage easily, so skip preview for this case
    } else {
      const { user } = await meResp.json();
      if (user) {
        if (displayNameInput && user.display_name) {
          displayNameInput.value = user.display_name;
        }
        if (profilePicturePreview && user.profile_pic) {
          // Assuming profile_pic is a URL path like 'uploads/avatar.jpg'
          // Adjust if it's a full URL or needs prefixing
          profilePicturePreview.src = `${window.location.origin}/${user.profile_pic}`;
          profilePicturePreview.style.display = 'block';
        }
      } else {
        // User data structure might be different or user is null
        console.warn('User data not found in /api/me response.');
        // Fallback to localStorage if user object is missing
        if (displayNameInput && localStorage.getItem('displayName')) {
          displayNameInput.value = localStorage.getItem('displayName');
        }
      }
    }
  } catch (error) {
    console.error('Error fetching user data:', error);
    // Fallback to localStorage on error
    if (displayNameInput && localStorage.getItem('displayName')) {
      displayNameInput.value = localStorage.getItem('displayName');
    }
  }

  // Preview new profile picture selection
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
      // Save display name to localStorage as a fallback or for immediate UI update
      if (displayNameInput) {
        localStorage.setItem('displayName', displayNameInput.value);
      }

      const formData = new FormData();
      formData.append('display_name', displayNameInput.value);

      // Only append profile picture if a new one has been selected
      if (profilePictureUpload.files && profilePictureUpload.files[0]) {
        formData.append('profile_pic', profilePictureUpload.files[0]);
      }
      // If no new file is selected, the backend should ideally not change the existing picture.
      // If the backend requires 'profile_pic' field, and removing it means "delete picture",
      // then this logic might need adjustment based on backend API specifics.

      try {
        const response = await fetch('/api/profile', {
          method: 'POST', // Or 'PUT' if your API uses PUT for updates
          credentials: 'include',
          body: formData, // FormData handles multipart/form-data header automatically
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ message: 'Failed to save profile. Server error.' }));
          throw new Error(errorData.message || `Server responded with ${response.status}`);
        }

        const result = await response.json();
        alert('Profile saved successfully!');

        // Optionally, update display name and avatar in header if it's displayed there
        // This might require a function to re-render header parts or a full reload of header logic
        if (typeof loadHeader === 'function') {
          // This assumes loadHeader() is globally available and can refresh the header.
          // However, main.js injects header HTML directly. We might need a more targeted update.
          // For now, a page reload might be the simplest way if main.js handles header on load.
          // Or, update the user object in main.js if it's accessible and re-render.
        }
        // If 'me' object from main.js was global or accessible, update it:
        // if (window.me && result.user) { // Assuming result.user contains the updated user
        //   window.me.display_name = result.user.display_name;
        //   window.me.profile_pic = result.user.profile_pic;
        //   // Then trigger a re-render of relevant header parts.
        // }

        // Refresh header information by re-calling the relevant part of main.js or a dedicated function
        // For simplicity, if main.js re-evaluates on DOMContentLoaded or similar,
        // parts of its logic for header might need to be callable.
        // A simple way to see changes in header is to reload, but that's not ideal UX.
        // Let's assume for now `main.js` will be updated to handle this.
        // If `main.js` has a function to update header user info, call it here.
        // e.g., if main.js exposes `updateUserInHeader(newUserObject)`
        if (result.user) {
            // If main.js sets a global `me` object that it uses to render the header:
            if (window.me) {
                window.me.display_name = result.user.display_name;
                window.me.profile_pic = result.user.profile_pic;
            }
            // Trigger a custom event that main.js can listen for to update the header
            document.dispatchEvent(new CustomEvent('userProfileUpdated', { detail: result.user }));
        }


      } catch (error) {
        console.error('Error saving profile:', error);
        alert(`Error: ${error.message}`);
      }

      // Potentially redirect or give other feedback (removed the old local save alert)
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
