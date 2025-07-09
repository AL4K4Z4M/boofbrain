/**
 * footer.js
 *
 * This file dynamically creates and injects the site footer into the DOM.
 */
function loadFooter() {
    const footerElement = document.getElementById('main-footer');
    if (footerElement) {
        // Simple footer without the visitor counter
        const footerHTML = `<p>&copy; 2025 boofbrain. All rights reserved.</p>`;
        footerElement.innerHTML = footerHTML;
    }
}

// Run the function when the document is ready
document.addEventListener('DOMContentLoaded', loadFooter);
