/**
 * header.js
 *
 * This file dynamically creates and injects the site header into the DOM
 * with the correct, final navigation links.
 */
function loadHeader() {
    const headerElement = document.getElementById('main-header');
    if (!headerElement) return;

    // Define the primary navigation links. DOOM has been removed.
    const navLinks = [
        { href: '/', text: 'Home' },
        { href: '/about.html', text: 'About' },
        { href: '/community.html', text: 'Community' },
        { href: '/contact_us.html', text: 'Contact Us' }
    ];

    // Build the navigation HTML
    const navHTML = navLinks.map(link => `<a href="${link.href}">${link.text}</a>`).join('');

    // Define the complete header HTML
    const headerHTML = `
        <div class="header-content">
            <a href="/" class="header-brand-title">bb</a>
            <nav class="main-nav">
                ${navHTML}
            </nav>
        </div>
    `;

    // Inject the HTML into the header element
    headerElement.innerHTML = headerHTML;
}

// Run the function when the document is ready
document.addEventListener('DOMContentLoaded', loadHeader);
