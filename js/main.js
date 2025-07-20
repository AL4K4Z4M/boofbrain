// js/main.js
document.addEventListener('DOMContentLoaded', async () => {
  // Determine current page
  const page = window.location.pathname.split('/').pop() || 'index.html';

  // 1) Fetch current user (if any)
  let me;
  try {
    const res = await fetch('/api/me', { credentials: 'include' });
    if (res.ok) {
      const data = await res.json();
      me = data.user;
    }
  } catch (e) {
    // not logged in or error
  }

  // 2) Inject Header
  document.getElementById('header-placeholder').innerHTML = `
    <header>
      <div class="content-wrapper header-content">
        <a href="index.html" class="header-brand-title">boofbrain</a>
        <nav class="main-nav">
          <ul id="nav-list">
            <li><a href="index.html">Home</a></li>
            <li><a href="about.html">About</a></li>
            <li><a href="community.html">Community</a></li>
            <li><a href="services.html">Services</a></li>
            <li><a href="plate-traits.html">Plate Traits</a></li>
            <li><a href="contact.html">Contact</a></li>
            <li><a href="inbox.html">Inbox</a></li>
            <li class="nav-stats">Users: – | Online: –</li>
            <li><a href="${me ? 'my-account.html' : 'auth.html'}">${me ? 'My Account' : 'Login'}</a></li>
          </ul>
        </nav>
        <button class="nav-toggle" aria-label="toggle navigation">
          <span class="hamburger"></span>
        </button>
      </div>
    </header>
  `;

  // 3) Inject Footer
  document.getElementById('footer-placeholder').innerHTML = `
    <footer>
      <p>&copy; 2025 boofbrain. All rights reserved.</p>
    </footer>
  `;

  // 4) Mobile nav toggle
  const navToggle = document.querySelector('.nav-toggle');
  const headerEl = document.querySelector('header');
  navToggle.addEventListener('click', () => headerEl.classList.toggle('nav-open'));

  // 5) Highlight active link
  document.querySelectorAll('.main-nav a').forEach(a => {
    if (a.getAttribute('href') === page) {
      a.classList.add('active');
    }
  });

  // 6) Fetch & display stats
  try {
    const stats = await fetch('/api/stats').then(r => r.json());
    document.querySelector('.nav-stats').textContent =
      `Users: ${stats.total} | Online: ${stats.online}`;
  } catch (e) {
    console.warn('Stats load failed', e);
  }

  // Function to update header for logged-in user
  function updateLoggedInHeader(currentUser) {
    const navList = document.getElementById('nav-list');
    if (!navList) return;

    // Clear existing dynamic elements (avatar, greeting, logout, old account link)
    navList.querySelectorAll('.nav-avatar, .nav-greeting-li, .nav-logout-li, .nav-account-link-li').forEach(el => el.remove());

    // Find and remove the generic Login/My Account link first
    // It might have been updated by the initial HTML injection
    const accountLinkLi = Array.from(navList.querySelectorAll('li')).find(li => {
        const a = li.querySelector('a');
        return a && (a.getAttribute('href') === 'auth.html' || a.getAttribute('href') === 'my-account.html');
    });
    if (accountLinkLi) {
        accountLinkLi.remove();
    }

    // Build avatar + greeting + My Account link + logout
    let avatarHTML = '';
    if (currentUser.profile_pic) {
      avatarHTML = `
        <li class="nav-avatar">
          <img src="${window.location.origin}/${currentUser.profile_pic}"
               alt="Avatar" class="avatar-img"/>
        </li>`;
    }
    const greetingHTML = `<li class="nav-greeting-li"><span class="nav-greeting">Hi, ${currentUser.display_name || currentUser.username}</span></li>`;
    const myAccountLinkHTML = `<li class="nav-account-link-li"><a href="my-account.html">My Account</a></li>`;
    const logoutHTML   = `<li class="nav-logout-li"><button id="logoutBtn" class="nav-logout">Logout</button></li>`;

    navList.insertAdjacentHTML('beforeend', avatarHTML + greetingHTML + myAccountLinkHTML + logoutHTML);

    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async () => {
          await fetch('/api/logout', { method: 'POST', credentials: 'include' });
          window.me = null; // Clear the global 'me' object
          updateGuestHeader(); // Re-render header for guest
          window.location.replace('auth.html'); // Redirect to login
        });
    }
  }

  // Function to update header for guest user
  function updateGuestHeader() {
    const navList = document.getElementById('nav-list');
    if (!navList) return;

    // Clear existing dynamic elements
    navList.querySelectorAll('.nav-avatar, .nav-greeting-li, .nav-logout-li, .nav-account-link-li').forEach(el => el.remove());

    // Ensure Login link is present
    if (!navList.querySelector('a[href="auth.html"]')) {
        const loginHTML = `<li><a href="auth.html">Login</a></li>`;
        navList.insertAdjacentHTML('beforeend', loginHTML);
    }
  }


  // 7) If logged in, swap in avatar/greeting/logout etc.
  // Make 'me' a window global for easier access from my-account.js if needed, or pass through events.
  window.me = me;

  if (window.me) {
    updateLoggedInHeader(window.me);
  } else {
    updateGuestHeader(); // Ensure header is correct for guests
  }

  // Listen for profile updates from my-account.js
  document.addEventListener('userProfileUpdated', (event) => {
    if (event.detail && window.me) {
      // Update the global 'me' object
      window.me.display_name = event.detail.display_name;
      window.me.profile_pic = event.detail.profile_pic;
      // Re-render the logged-in header parts
      updateLoggedInHeader(window.me);
    }
  });
});
