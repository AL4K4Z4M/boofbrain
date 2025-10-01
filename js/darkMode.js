const THEME_STORAGE_KEY = 'boofbrain.theme';

const prefersDarkMode = () => {
    if (!window.matchMedia) {
        return false;
    }

    return window.matchMedia('(prefers-color-scheme: dark)').matches;
};

const getStoredTheme = () => {
    try {
        return localStorage.getItem(THEME_STORAGE_KEY);
    } catch (error) {
        console.warn('Unable to access localStorage to read theme preference.', error);
        return null;
    }
};

const storeTheme = (theme) => {
    try {
        localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch (error) {
        console.warn('Unable to access localStorage to persist theme preference.', error);
    }
};

const applyTheme = (theme) => {
    const root = document.documentElement;
    const isDark = theme === 'dark';

    root.classList.toggle('dark', isDark);

    const icon = document.getElementById('darkModeIcon');
    if (icon) {
        icon.textContent = isDark ? 'dark_mode' : 'light_mode';
    }
};

const resolveInitialTheme = () => {
    const storedTheme = getStoredTheme();

    if (storedTheme === 'dark' || storedTheme === 'light') {
        return storedTheme;
    }

    return prefersDarkMode() ? 'dark' : 'light';
};

export const initDarkModeToggle = () => {
    const toggle = document.getElementById('darkModeToggle');

    if (!toggle) {
        return;
    }

    let currentTheme = resolveInitialTheme();
    applyTheme(currentTheme);

    toggle.addEventListener('click', () => {
        currentTheme = currentTheme === 'dark' ? 'light' : 'dark';
        applyTheme(currentTheme);
        storeTheme(currentTheme);
    });
};
