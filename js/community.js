/**
 * community.js
 * * This script imports suggestions, sorts them, and builds the HTML.
 * It now handles internal and external links correctly.
 */

import { suggestions } from './suggestions.js';

document.addEventListener('DOMContentLoaded', () => {
    const suggestionsListContainer = document.getElementById('suggestions-list');

    if (suggestionsListContainer) {
        // Sort the suggestions alphabetically by title
        const sortedSuggestions = suggestions.sort((a, b) => a.title.localeCompare(b.title));

        if (sortedSuggestions.length === 0) {
            suggestionsListContainer.innerHTML = `<p class="no-suggestions">No community suggestions yet. Be the first!</p>`;
            return;
        }

        // Generate the HTML for each suggestion
        const suggestionsHTML = sortedSuggestions.map(suggestion => {
            const isClickable = suggestion.url && suggestion.url !== '#';
            const isExternal = isClickable && suggestion.url.startsWith('http');

            const tag = isClickable ? 'a' : 'div';
            const href = isClickable ? `href="${suggestion.url}"` : '';
            const cardClass = isClickable ? 'suggestion-card clickable' : 'suggestion-card';
            // Open external links in a new tab for better user experience
            const linkAttributes = isExternal ? 'target="_blank" rel="noopener noreferrer"' : '';

            return `
                <${tag} ${href} class="${cardClass}" ${linkAttributes}>
                    <h3 class="suggestion-title">${suggestion.title}</h3>
                    <p class="suggestion-description">${suggestion.description}</p>
                    <div class="suggestion-attribution">
                        Suggested by: <span class="suggester-name">${suggestion.suggestedBy}</span>
                    </div>
                </${tag}>
            `;
        }).join('');

        // Inject the generated HTML into the container
        suggestionsListContainer.innerHTML = suggestionsHTML;
    }
});
