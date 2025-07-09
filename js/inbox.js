// js/inbox.js
document.addEventListener('DOMContentLoaded', async () => {
  // Main compose form (for new conversations)
  const composeForm        = document.getElementById('compose-form');
  const recipientSelect    = document.getElementById('recipient-select');
  const composeContent     = document.getElementById('compose-content');
  const composeErrorEl     = document.getElementById('compose-error');
  const composeSuccessEl   = document.getElementById('compose-success');

  // Conversation display elements
  const conversationListItemsEl = document.getElementById('conversation-list-items');
  const conversationPlaceholder = document.getElementById('conversation-placeholder');
  const conversationHeaderEl    = document.getElementById('conversation-header');
  const messageDisplayAreaEl  = document.getElementById('message-display-area');

  // Reply form (for existing conversations)
  const replyForm           = document.getElementById('reply-form');
  const replyContent        = document.getElementById('reply-content');
  const replyErrorEl        = document.getElementById('reply-error');
  const replySuccessEl      = document.getElementById('reply-success');

  let currentPartnerId    = null;
  let currentPartnerName  = null;
  let allUsers            = []; // To store user data for easy lookup

  // 1) Load users into the main recipient dropdown and store them
  try {
    const users = await fetch('/api/users', { credentials: 'include' }).then(r => r.json());
    allUsers = users; // Store for later use
    users.forEach(u => {
      const opt = document.createElement('option');
      opt.value = u.id;
      opt.textContent = u.username;
      recipientSelect.append(opt);
    });
  } catch {
    recipientSelect.innerHTML = '<option disabled>Failed to load users</option>';
  }

  // 2) Fetch & render conversation partners
  async function loadConversationPartners() {
    conversationListItemsEl.innerHTML = ''; // Clear previous list
    try {
      const partners = await fetch('/api/conversations', { credentials: 'include' }).then(r => r.json());
      if (partners.length === 0) {
        const p = document.createElement('p');
        p.textContent = 'No active conversations. Compose a message to start one!';
        conversationListItemsEl.appendChild(p);
        return;
      }
      partners.forEach(partner => {
        const item = document.createElement('div');
        item.className = 'conversation-list-item feature-card'; // Re-use feature-card styling for items
        item.textContent = `Chat with ${partner.username}`;
        item.dataset.partnerId = partner.id;
        item.dataset.partnerName = partner.username;
        item.addEventListener('click', () => selectConversation(partner.id, partner.username));
        conversationListItemsEl.appendChild(item);
      });
    } catch (err) {
      console.error('Failed to load conversation partners:', err);
      conversationListItemsEl.innerHTML = '<p>Error loading conversations.</p>';
    }
  }

  // 3) Handle selecting a conversation
  async function selectConversation(partnerId, partnerName) {
    currentPartnerId = partnerId;
    currentPartnerName = partnerName;

    conversationPlaceholder.style.display = 'none';
    messageDisplayAreaEl.innerHTML = ''; // Clear previous messages
    conversationHeaderEl.innerHTML = `<h3>Chat with ${partnerName}</h3>`;
    replyForm.style.display = 'flex'; // Show reply form

    // Highlight selected partner
    document.querySelectorAll('.conversation-list-item').forEach(item => {
        item.classList.toggle('active', item.dataset.partnerId === partnerId);
    });

    try {
      const messages = await fetch(`/api/messages/thread/${partnerId}`, { credentials: 'include' }).then(r => r.json());
      if (messages.length === 0) {
        messageDisplayAreaEl.innerHTML = '<p>No messages yet in this conversation.</p>';
      } else {
        messages.forEach(msg => {
          const div = document.createElement('div');
          // Note: The API returns sender_id. If message sender_id is the partnerId, it's 'in', otherwise it's 'out'.
          div.className = msg.sender_id.toString() === partnerId.toString() ? 'message-in' : 'message-out';
          div.textContent = msg.content;
          // Optionally, add timestamp:
          // const small = document.createElement('small');
          // small.textContent = new Date(msg.created_at).toLocaleTimeString();
          // div.appendChild(small);
          messageDisplayAreaEl.appendChild(div);
        });
      }
      messageDisplayAreaEl.scrollTop = messageDisplayAreaEl.scrollHeight; // Scroll to bottom
    } catch (err) {
      console.error('Failed to load thread:', err);
      messageDisplayAreaEl.innerHTML = '<p>Error loading messages.</p>';
    }
    replyContent.focus();
  }

  // 4) Handle main compose form submit (for new conversations)
  composeForm.addEventListener('submit', async e => {
    e.preventDefault();
    composeErrorEl.textContent = '';
    composeSuccessEl.textContent  = '';

    const recipientId = recipientSelect.value;
    const text        = composeContent.value.trim();
    if (!recipientId || !text) {
      composeErrorEl.textContent = 'Recipient and message text are required.';
      return;
    }

    try {
      const res = await fetch('/api/messages', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recipientId, content: text })
      });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ message: 'Send failed with no details' }));
        throw new Error(errorData.message || 'Send failed');
      }
      composeSuccessEl.textContent = 'Message sent!';
      composeContent.value    = '';
      recipientSelect.value = ''; // Reset recipient select

      // Refresh conversation list and potentially select the new/updated conversation
      await loadConversationPartners();
      // Try to find the user that was just messaged to auto-select the conversation
      const selectedUser = allUsers.find(user => user.id.toString() === recipientId);
      if (selectedUser) {
        selectConversation(selectedUser.id, selectedUser.username);
      }

    } catch (err) {
      composeErrorEl.textContent = err.message;
    }
  });

  // 5) Handle reply form submit
  replyForm.addEventListener('submit', async e => {
    e.preventDefault();
    replyErrorEl.textContent = '';
    replySuccessEl.textContent = '';

    const text = replyContent.value.trim();
    if (!text || !currentPartnerId) {
      replyErrorEl.textContent = 'Message text is required.';
      return;
    }

    try {
      const res = await fetch('/api/messages', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recipientId: currentPartnerId, content: text })
      });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ message: 'Reply failed with no details' }));
        throw new Error(errorData.message || 'Reply failed');
      }
      replySuccessEl.textContent = 'Reply sent!';
      replyContent.value = '';
      // Refresh the current conversation view
      await selectConversation(currentPartnerId, currentPartnerName);
    } catch (err) {
      replyErrorEl.textContent = err.message;
    }
  });

  // Initial load
  await loadConversationPartners();
});
