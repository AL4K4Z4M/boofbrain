// js/conversations.js
document.addEventListener('DOMContentLoaded', async () => {
  const listEl = document.getElementById('convo-list');

  // Fetch partners
  let partners = [];
  try {
    partners = await fetch('/api/conversations', { credentials: 'include' })
      .then(r => r.json());
  } catch {
    listEl.innerHTML = '<li>Error loading conversations.</li>';
    return;
  }

  if (!partners.length) {
    listEl.innerHTML = '<li>No conversations yet.</li>';
    return;
  }

  // Render list
  partners.forEach(p => {
    const li = document.createElement('li');
    li.className = 'feature-card';
    li.innerHTML = `
      <a href="thread.html?with=${p.id}">
        Chat with <strong>${p.username}</strong>
      </a>
    `;
    listEl.append(li);
  });
});
1~xx// js/conversations.js
document.addEventListener('DOMContentLoaded', async () => {
  const listEl = document.getElementById('convo-list');

  // Fetch partners
  let partners = [];
  try {
    partners = await fetch('/api/conversations', { credentials: 'include' })
      .then(r => r.json());
  } catch {
    listEl.innerHTML = '<li>Error loading conversations.</li>';
    return;
  }

  if (!partners.length) {
    listEl.innerHTML = '<li>No conversations yet.</li>';
    return;
  }

  // Render list
  partners.forEach(p => {
    const li = document.createElement('li');
    li.className = 'feature-card';
    li.innerHTML = `
      <a href="thread.html?with=${p.id}">
        Chat with <strong>${p.username}</strong>
      </a>
    `;
    listEl.append(li);
  });
});
1~// js/conversations.js
document.addEventListener('DOMContentLoaded', async () => {
  const listEl = document.getElementById('convo-list');

  // Fetch partners
  let partners = [];
  try {
    partners = await fetch('/api/conversations', { credentials: 'include' })
      .then(r => r.json());
  } catch {
    listEl.innerHTML = '<li>Error loading conversations.</li>';
    return;
  }

  if (!partners.length) {
    listEl.innerHTML = '<li>No conversations yet.</li>';
    return;
  }

  // Render list
  partners.forEach(p => {
    const li = document.createElement('li');
    li.className = 'feature-card';
    li.innerHTML = `
      <a href="thread.html?with=${p.id}">
        Chat with <strong>${p.username}</strong>
      </a>
    `;
    listEl.append(li);
  });
});
