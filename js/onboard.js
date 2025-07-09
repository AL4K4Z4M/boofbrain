// js/onboard.js
document.addEventListener('DOMContentLoaded', async () => {
  // redirect if already onboarded
  const resp = await fetch('/api/onboard', { credentials: 'include' });
  const { onboarded } = await resp.json().catch(() => ({ onboarded: true }));
  if (onboarded) return window.location.href = '/';

  const form = document.getElementById('onboardForm');
  form.addEventListener('submit', async e => {
    e.preventDefault();
    const data = new FormData(form);
    const res  = await fetch('/api/onboard', {
      method: 'POST',
      credentials: 'include',
      body: data
    });

    let payload;
    try {
      payload = await res.json();
    } catch {
      payload = { error: await res.text() };
    }

    if (!res.ok) {
      alert(`❌ ${payload.error}`);
      return;
    }
    window.location.href = '/';
  });
});
