// js/inbox.js
document.addEventListener('DOMContentLoaded', async () => {
  const listEl    = document.getElementById('inbox-list');
  const form      = document.getElementById('compose-form');
  const recipient = document.getElementById('recipient-select');
  const content   = document.getElementById('compose-content');
  const errEl     = document.getElementById('compose-error');
  const okEl      = document.getElementById('compose-success');

  // 1) Load users into the recipient dropdown
  try {
    const users = await fetch('/api/users', { credentials: 'include' }).then(r => r.json());
    users.forEach(u => {
      const opt = document.createElement('option');
      opt.value = u.id;
      opt.textContent = u.username;
      recipient.append(opt);
    });
  } catch {
    recipient.innerHTML = '<option disabled>Failed to load users</option>';
  }

  // 2) Fetch & render inbox messages
  async function loadInbox() {
    listEl.innerHTML = '';
    try {
      const msgs = await fetch('/api/messages/inbox', { credentials: 'include' }).then(r => r.json());
      if (msgs.length === 0) {
        listEl.textContent = 'No messages.';
        return;
      }
      msgs.forEach(msg => {
        const card = document.createElement('div');
        card.className = 'feature-card';
        card.innerHTML = `
          <div style="display:flex; justify-content:space-between;">
            <strong>From: ${msg.sender}</strong>
            <small>${new Date(msg.created_at).toLocaleString()}</small>
          </div>
          <p>${msg.content}</p>
          <button data-id="${msg.id}" class="mark-read-button" ${msg.is_read ? 'disabled' : ''}>
            ${msg.is_read ? 'Read' : 'Mark as read'}
          </button>
        `;
        listEl.appendChild(card);
      });
    } catch {
      listEl.textContent = 'Failed to load your inbox.';
    }
  }

  listEl.addEventListener('click', async e => {
    if (!e.target.matches('.mark-read-button')) return;
    const btn = e.target, id = btn.dataset.id;
    await fetch(`/api/messages/${id}/read`, {
      method: 'POST',
      credentials: 'include'
    });
    btn.textContent = 'Read';
    btn.disabled = true;
  });

  await loadInbox();

  // 3) Handle compose form submit
  form.addEventListener('submit', async e => {
    e.preventDefault();
    errEl.textContent = '';
    okEl.textContent  = '';

    const recipientId = recipient.value;
    const text        = content.value.trim();
    if (!recipientId || !text) {
      errEl.textContent = 'Both fields are required.';
      return;
    }

    try {
      const res = await fetch('/api/messages', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recipientId, content: text })
      });
      if (!res.ok) throw new Error('Send failed');
      okEl.textContent = 'Message sent!';
      content.value    = '';
      await loadInbox();
    } catch (err) {
      errEl.textContent = err.message;
    }
  });
});
