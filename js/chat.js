// js/chat.js
document.addEventListener('DOMContentLoaded', async () => {
  // Ensure user is logged in
  const meResp = await fetch('/api/me', { credentials: 'include' });
  if (!meResp.ok) {
    window.location.href = 'auth.html';
    return;
  }
  const { user } = await meResp.json();

  const socket = io({ transports: ['websocket'] });

  const messagesEl = document.getElementById('messages');
  const form = document.getElementById('chatForm');
  const input = document.getElementById('messageInput');

  // Utility: escape HTML to prevent XSS
  function escapeHTML(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  // Render a single message
  function appendMessage({ author, text, ts }) {
    const msgEl = document.createElement('div');
    msgEl.classList.add('message');
    const time = new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    msgEl.innerHTML = `
      <span class="author">${escapeHTML(author)}</span>
      <span class="text">${escapeHTML(text)}</span>
      <span class="ts" style="float:right; font-size:0.8em; color:var(--color-text-muted)">${time}</span>
    `;
    messagesEl.appendChild(msgEl);
    messagesEl.scrollTop = messagesEl.scrollHeight;
  }

  // On connect, fetch last 50 messages
  socket.on('history', history => {
    history.forEach(appendMessage);
  });

  // On new message
  socket.on('message', appendMessage);

  // Send on form submit
  form.addEventListener('submit', e => {
    e.preventDefault();
    const text = input.value.trim();
    if (!text) return;
    socket.emit('message', { author: user.display_name || user.username, text });
    input.value = '';
  });
});
