// js/thread.js
document.addEventListener('DOMContentLoaded', async () => {
  const params = new URLSearchParams(location.search);
  const otherId = params.get('with');
  if (!otherId) return alert('No conversation specified.');

  const titleEl   = document.getElementById('thread-title');
  const msgsEl    = document.getElementById('thread-messages');
  const form      = document.getElementById('thread-form');
  const input     = document.getElementById('thread-input');

  // Fetch other’s username
  let otherName = 'User';
  try {
    const [{ username }] = await fetch('/api/users', { credentials: 'include' })
      .then(r => r.json())
      .then(users => users.filter(u => u.id == otherId));
    if (username) otherName = username;
  } catch {}

  titleEl.textContent = `Chat with ${otherName}`;

  // Load entire thread
  async function loadThread() {
    msgsEl.innerHTML = '';
    try {
      const msgs = await fetch(`/api/messages/thread/${otherId}`, { credentials: 'include' })
        .then(r => r.json());
      msgs.forEach(m => {
        const div = document.createElement('div');
        div.className = m.sender_id == otherId ? 'message-in' : 'message-out';
        div.textContent = m.content;
        msgsEl.append(div);
      });
      msgsEl.scrollTop = msgsEl.scrollHeight;
    } catch {
      msgsEl.innerHTML = '<p>Error loading thread.</p>';
    }
  }

  // Send new message
  form.addEventListener('submit', async e => {
    e.preventDefault();
    const text = input.value.trim();
    if (!text) return;
    await fetch('/api/messages', {
      method: 'POST',
      credentials: 'include',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify({ recipientId: otherId, content: text })
    });
    input.value = '';
    await loadThread();
  });

  await loadThread();
});
