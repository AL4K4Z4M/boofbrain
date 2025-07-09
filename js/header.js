/**
 * header.js
 *
 * This file dynamically creates and injects the site header into the DOM
 * with the correct, final navigation links.
 * It also conditionally adds a "Chat" link if the user is logged in.
 */
async function loadHeader() {
    const headerElement = document.getElementById('main-header');
    if (!headerElement) return;

    // Define the primary navigation links.
    const baseNavLinks = [
        { href: '/', text: 'Home' },
        { href: '/about.html', text: 'About' },
        { href: '/community.html', text: 'Community' },
        { href: '/contact_us.html', text: 'Contact Us' }
    ];

    let allNavLinks = [...baseNavLinks];

    // Check if user is logged in
    try {
        const meResp = await fetch('/api/me', { credentials: 'include' });
        if (meResp.ok) {
            // User is logged in, add Chat link
            allNavLinks.push({ href: '/chat.html', text: 'Chat' });
            // Potentially add a "My Account" link here in the future if needed
            // allNavLinks.push({ href: '/my-account.html', text: 'My Account' });
        }
    } catch (error) {
        console.warn('Could not verify login status for header:', error);
        // Proceed with default links if /api/me fails
    }

    // Build the navigation HTML
    const navHTML = allNavLinks.map(link => `<a href="${link.href}">${link.text}</a>`).join('');

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

    // Check for logout button (if it's part of header.js responsibility)
    // This part assumes logout functionality might also be in header.js or main.js
    // For now, just focusing on adding the chat link.
    // If a logout button exists and is handled by js/main.js or js/auth.js, this is fine.
    // If header.js needs to handle logout, that would be a separate modification.
}

// Run the function when the document is ready
document.addEventListener('DOMContentLoaded', loadHeader);
