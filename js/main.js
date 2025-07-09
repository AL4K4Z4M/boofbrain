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
            <li><a href="contact.html">Contact</a></li>
            <li><a href="inbox.html">Inbox</a></li>
            <li class="nav-stats">Users: – | Online: –</li>
            <li><a href="auth.html">${me ? 'Account' : 'Login'}</a></li>
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

  // 7) If logged in, swap in avatar/greeting/logout
  if (me) {
    const navList = document.getElementById('nav-list');
    // remove the existing Login/Account link
    navList.querySelectorAll('li').forEach(li => {
      const a = li.querySelector('a');
      if (a?.getAttribute('href') === 'auth.html') {
        li.remove();
      }
    });

    // build avatar + greeting + logout
    let avatarHTML = '';
    if (me.profile_pic) {
      avatarHTML = `
        <li class="nav-avatar">
          <img src="${window.location.origin}/${me.profile_pic}"
               alt="Avatar" class="avatar-img"/>
        </li>`;
    }
    const greetingHTML = `<li><span class="nav-greeting">Hi, ${me.display_name || me.username}</span></li>`;
    const logoutHTML   = `<li><button id="logoutBtn" class="nav-logout">Logout</button></li>`;

    navList.insertAdjacentHTML('beforeend', avatarHTML + greetingHTML + logoutHTML);

    document.getElementById('logoutBtn').addEventListener('click', async () => {
      await fetch('/api/logout', { method: 'POST', credentials: 'include' });
      window.location.replace('auth.html');
    });
  }
});
