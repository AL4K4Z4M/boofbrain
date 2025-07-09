// js/auth.js
document.addEventListener('DOMContentLoaded', () => {
  // Tab elements
  const tabLogin     = document.getElementById('tab-login');
  const tabRegister  = document.getElementById('tab-register');
  const formLogin    = document.getElementById('login-form');
  const formRegister = document.getElementById('register-form');

  // Switch to login view
  tabLogin.addEventListener('click', () => {
    tabLogin.classList.add('active');
    tabRegister.classList.remove('active');
    formLogin.classList.add('active');
    formRegister.classList.remove('active');
  });

  // Switch to register view
  tabRegister.addEventListener('click', () => {
    tabRegister.classList.add('active');
    tabLogin.classList.remove('active');
    formRegister.classList.add('active');
    formLogin.classList.remove('active');
  });

  // -------- SHOW / HIDE PASSWORD --------
  function wireShowPw(checkboxId, inputId) {
    const cb = document.getElementById(checkboxId);
    const inp = document.getElementById(inputId);
    cb.addEventListener('change', () => {
      inp.type = cb.checked ? 'text' : 'password';
    });
  }
  wireShowPw('login-show-pw', 'login-password');
  wireShowPw('reg-show-pw', 'reg-password');
  wireShowPw('reg-show-pw-confirm', 'reg-password-confirm');

  // -------- LOGIN FORM --------
  formLogin.addEventListener('submit', async e => {
    e.preventDefault();
    const errEl = document.getElementById('login-error');
    errEl.textContent = '';

    const username = document.getElementById('login-username').value.trim();
    const password = document.getElementById('login-password').value;

    try {
      const resp = await fetch('/api/login', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      if (!resp.ok) {
        const txt = await resp.text();
        throw new Error(txt || 'Login failed');
      }
      window.location.href = 'index.html';
    } catch (err) {
      errEl.textContent = err.message;
    }
  });

  // -------- REGISTER FORM --------
  const pwdInput     = document.getElementById('reg-password');
  const pwdConfirm   = document.getElementById('reg-password-confirm');
  const submitBtn    = formRegister.querySelector('.submit-button');
  const pwdErrEl     = document.getElementById('password-errors');
  let pwnedOK = false, strengthOK = false;

  // Strength checks
  function checkStrength() {
    const pw = pwdInput.value;
    const errors = [];
    if (pw.length < 8) errors.push('Min 8 chars');
    if (!/[a-z]/.test(pw)) errors.push('lowercase');
    if (!/[A-Z]/.test(pw)) errors.push('UPPERCASE');
    if (!/[0-9]/.test(pw)) errors.push('digit');
    if (!/[^A-Za-z0-9]/.test(pw)) errors.push('special');
    strengthOK = errors.length === 0;
    return errors;
  }

  // Match check
  function checkMatch() {
    return pwdInput.value === pwdConfirm.value;
  }

  // HIBP k-anonymity check
  async function checkPwned() {
    const pw = pwdInput.value;
    if (!pw) return false;
    const hashBuf = await crypto.subtle.digest('SHA-1', new TextEncoder().encode(pw));
    const hashHex = Array.from(new Uint8Array(hashBuf))
      .map(b => b.toString(16).padStart(2,'0'))
      .join('').toUpperCase();
    const prefix = hashHex.slice(0,5), suffix = hashHex.slice(5);
    const resp = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`);
    const txt  = await resp.text();
    pwnedOK = !txt.split('\n').some(line => line.split(':')[0] === suffix);
    return pwnedOK;
  }

  // Combined validation
  async function validateRegister() {
    const strengthErrors = checkStrength();
    const matchOK = checkMatch();
    pwdErrEl.textContent = '';

    if (!strengthOK) {
      pwdErrEl.textContent = strengthErrors.join(', ');
    } else if (!matchOK) {
      pwdErrEl.textContent = 'Passwords do not match';
    } else {
      pwdErrEl.textContent = 'Checking safety…';
      const safe = await checkPwned();
      if (!safe) pwdErrEl.textContent = 'Password breached—choose another';
      else pwdErrEl.textContent = '';
    }

    submitBtn.disabled = !(strengthOK && matchOK && pwnedOK);
  }

  // Trigger checks on input
  pwdInput.addEventListener('input', () => {
    pwnedOK = false;
    const errs = checkStrength();
    strengthOK = errs.length === 0;
    validateRegister();
  });
  pwdConfirm.addEventListener('input', validateRegister);

  // Submit registration
  formRegister.addEventListener('submit', async e => {
    e.preventDefault();
    document.getElementById('register-error').textContent = '';

    const username = document.getElementById('reg-username').value.trim();
    const email    = document.getElementById('reg-email').value.trim();
    const password = pwdInput.value;

    try {
      const resp = await fetch('/api/register', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email, password })
      });
      if (!resp.ok) {
        const txt = await resp.text();
        throw new Error(txt || 'Registration failed');
      }
      // redirect to onboarding
      window.location.href = 'onboarding.html';
    } catch (err) {
      document.getElementById('register-error').textContent = err.message;
    }
  });
});
