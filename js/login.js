import { initDarkModeToggle } from './darkMode.js';

const MESSAGE_VARIANT_CLASSES = {
    success: [
        'border-green-500/60',
        'bg-green-50',
        'text-green-700',
        'dark:border-green-400/40',
        'dark:bg-green-500/10',
        'dark:text-green-200'
    ],
    error: [
        'border-red-500/60',
        'bg-red-50',
        'text-red-700',
        'dark:border-red-400/40',
        'dark:bg-red-500/10',
        'dark:text-red-200'
    ]
};

const TOKEN_STORAGE_KEY = 'boofbrain.authToken';
const API_PORT = '5000';

const getApiBaseUrl = () => {
    if (typeof window === 'undefined') {
        return '';
    }

    const meta = document.querySelector('meta[name="api-base-url"]');

    if (meta && typeof meta.content === 'string' && meta.content.trim() !== '') {
        return meta.content.replace(/\/$/, '');
    }

    const { protocol, hostname, port } = window.location;

    if (protocol === 'file:') {
        return `http://localhost:${API_PORT}`;
    }

    const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1';

    if (isLocalhost && port && port !== API_PORT) {
        return `${protocol}//${hostname}:${API_PORT}`;
    }

    return '';
};

const buildApiUrl = (path) => `${getApiBaseUrl()}${path}`;

const clearMessage = (messageEl) => {
    messageEl.classList.add('hidden');
    messageEl.textContent = '';

    Object.values(MESSAGE_VARIANT_CLASSES).forEach((classes) => {
        classes.forEach((className) => messageEl.classList.remove(className));
    });
};

const showMessage = (messageEl, variant, text) => {
    clearMessage(messageEl);
    const variantClasses = MESSAGE_VARIANT_CLASSES[variant];

    if (variantClasses) {
        variantClasses.forEach((className) => messageEl.classList.add(className));
    }

    messageEl.textContent = text;
    messageEl.classList.remove('hidden');
};

const buildPayload = ({ email, username, password }) => {
    const payload = { password };

    if (email) {
        payload.email = email;
    }

    if (username) {
        payload.username = username;
    }

    return payload;
};

const readJsonSafely = async (response) => {
    try {
        return await response.json();
    } catch (error) {
        return null;
    }
};

const persistToken = (token, rememberMe) => {
    if (!token) {
        return;
    }

    try {
        if (rememberMe) {
            localStorage.setItem(TOKEN_STORAGE_KEY, token);
        } else {
            sessionStorage.setItem(TOKEN_STORAGE_KEY, token);
        }
    } catch (error) {
        console.warn('Unable to store authentication token.', error);
    }
};

const handleSubmit = async (event) => {
    event.preventDefault();

    const form = event.currentTarget;
    const submitButton = form.querySelector('button[type="submit"]');
    const messageEl = document.getElementById('loginMessage');

    if (!messageEl || !submitButton) {
        return;
    }

    const originalButtonText = submitButton.textContent;

    clearMessage(messageEl);

    const formData = new FormData(form);
    const email = (formData.get('email') || '').trim();
    const username = (formData.get('username') || '').trim();
    const password = formData.get('password') || '';
    const rememberMe = formData.get('rememberMe') === 'on';

    if (!email && !username) {
        showMessage(messageEl, 'error', 'Please provide your email or username to sign in.');
        return;
    }

    if (!password) {
        showMessage(messageEl, 'error', 'Your password is required to continue.');
        return;
    }

    submitButton.disabled = true;
    submitButton.textContent = 'Signing you in...';

    try {
        const response = await fetch(buildApiUrl('/api/login'), {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(
                buildPayload({
                    email,
                    username,
                    password
                })
            )
        });

        const payload = await readJsonSafely(response);

        if (!response.ok) {
            const errorMessage = payload && payload.error ? payload.error : 'Unable to sign in. Please try again later.';
            showMessage(messageEl, 'error', errorMessage);
            return;
        }

        persistToken(payload && payload.token, rememberMe);

        const displayName = payload && payload.user && (payload.user.username || payload.user.email);
        showMessage(
            messageEl,
            'success',
            displayName
                ? `Welcome back, ${displayName}!`
                : 'Welcome back! You are now signed in.'
        );
    } catch (error) {
        console.error('Login request failed:', error);
        showMessage(messageEl, 'error', 'Unable to reach the server. Check your connection and try again.');
    } finally {
        submitButton.disabled = false;
        submitButton.textContent = originalButtonText;
    }
};

document.addEventListener('DOMContentLoaded', () => {
    initDarkModeToggle();

    const form = document.getElementById('loginForm');

    if (form) {
        form.addEventListener('submit', handleSubmit);
    }
});
