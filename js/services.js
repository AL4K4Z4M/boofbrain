/**
 * services.js
 * * This script imports services, sorts them, and builds the HTML.
 * It now handles internal and external links correctly.
 */

import { services } from './servicesData.js';

document.addEventListener('DOMContentLoaded', () => {
    const servicesListContainer = document.getElementById('services-list');

    if (servicesListContainer) {
        // Sort the services alphabetically by title
        const sortedServices = services.sort((a, b) => a.title.localeCompare(b.title));

        if (sortedServices.length === 0) {
            servicesListContainer.innerHTML = `<p class="no-services">No services available yet. Check back soon!</p>`;
            return;
        }

        // Generate the HTML for each service
        const servicesHTML = sortedServices.map(service => {
            const isClickable = service.url && service.url !== '#';
            const isExternal = isClickable && service.url.startsWith('http');

            const tag = isClickable ? 'a' : 'div';
            const href = isClickable ? `href="${service.url}"` : '';
            const cardClass = isClickable ? 'service-card clickable' : 'service-card';
            // Open external links in a new tab for better user experience
            const linkAttributes = isExternal ? 'target="_blank" rel="noopener noreferrer"' : '';

            return `
                <${tag} ${href} class="${cardClass}" ${linkAttributes}>
                    <h3 class="service-title">${service.title}</h3>
                    <p class="service-description">${service.description}</p>
                    <div class="service-attribution">
                        Hosted by: <span class="hoster-name">${service.hostedBy}</span>
                    </div>
                </${tag}>
            `;
        }).join('');

        // Inject the generated HTML into the container
        servicesListContainer.innerHTML = servicesHTML;
    }
});
