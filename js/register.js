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

const buildPayload = ({ email, username, password, ageVerified, termsAgreed }) => {
    const payload = {
        password,
        ageVerified,
        termsAgreed
    };

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

const handleSubmit = async (event) => {
    event.preventDefault();

    const form = event.currentTarget;
    const submitButton = form.querySelector('button[type="submit"]');
    const messageEl = document.getElementById('formMessage');

    if (!messageEl || !submitButton) {
        return;
    }

    const originalButtonText = submitButton.textContent;

    clearMessage(messageEl);

    const formData = new FormData(form);
    const email = (formData.get('email') || '').trim();
    const username = (formData.get('username') || '').trim();
    const password = formData.get('password') || '';
    const confirmPassword = formData.get('confirmPassword') || '';
    const ageVerified = formData.get('ageVerified') === 'on';
    const termsAgreed = formData.get('termsAgreed') === 'on';

    if (!email && !username) {
        showMessage(messageEl, 'error', 'Please provide at least an email or a username to continue.');
        return;
    }

    if (password.length < 8) {
        showMessage(messageEl, 'error', 'Your password must be at least 8 characters long.');
        return;
    }

    if (password !== confirmPassword) {
        showMessage(messageEl, 'error', 'Passwords do not match. Please re-enter them.');
        return;
    }

    if (!ageVerified) {
        showMessage(messageEl, 'error', 'You must confirm that you meet the legal age requirement.');
        return;
    }

    if (!termsAgreed) {
        showMessage(messageEl, 'error', 'Please agree to the Terms of Service to continue.');
        return;
    }

    submitButton.disabled = true;
    submitButton.textContent = 'Creating your account...';

    try {
        const response = await fetch('/api/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(
                buildPayload({
                    email,
                    username,
                    password,
                    ageVerified,
                    termsAgreed
                })
            )
        });

        const payload = await readJsonSafely(response);

        if (!response.ok) {
            const errorMessage = payload && payload.error ? payload.error : 'Registration failed. Please try again later.';
            showMessage(messageEl, 'error', errorMessage);
            return;
        }

        form.reset();
        showMessage(
            messageEl,
            'success',
            'Account created! You can now log in using your new credentials.'
        );
    } catch (error) {
        console.error('Registration request failed:', error);
        showMessage(messageEl, 'error', 'Unable to reach the server. Check your connection and try again.');
    } finally {
        submitButton.disabled = false;
        submitButton.textContent = originalButtonText;
    }
};

document.addEventListener('DOMContentLoaded', () => {
    initDarkModeToggle();

    const form = document.getElementById('registrationForm');

    if (form) {
        form.addEventListener('submit', handleSubmit);
    }
});
