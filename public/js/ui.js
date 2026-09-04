/**
 * The browser half of the app.
 *
 * The server already rendered the assignment list into the page, so there is
 * nothing to draw on load. This file exists to make the filters feel instant:
 * change a dropdown, and the list is replaced without a full page reload.
 *
 * Everything here is an enhancement. Turn JavaScript off and the page still
 * works -- the filter form falls back to a normal GET submit, which is why it
 * was written as a real <form> with a real submit button.
 */

import { fetchAssignmentListHtml } from './api.js';

const filters = document.querySelector('#filters');
const container = document.querySelector('#assignment-container');

// Nothing to enhance on pages without the tracker (the submit page, say).
if (filters && container) {
    // The Apply button is only needed when JavaScript is off, and this line
    // only runs when it is on.
    const applyButton = filters.querySelector('.filter-button');
    if (applyButton) {
        applyButton.hidden = true;
    }

    /**
     * Reload the list for the current filter values.
     * @returns {Promise<void>} Resolves once the new list is on screen.
     */
    async function refresh() {
        // FormData reads the form's current values, and URLSearchParams turns
        // them into 'days=7&course=123' without any string building.
        const params = new URLSearchParams(new FormData(filters));

        container.setAttribute('aria-busy', 'true');

        try {
            // The server escaped every value on the way out, so this HTML is
            // safe to insert. Never do this with HTML from somewhere else.
            container.innerHTML = await fetchAssignmentListHtml(params);

            // Keep the address bar in step with what is on screen, so the page
            // can be reloaded or bookmarked and look the same. replaceState
            // updates the URL without adding a history entry for every twitch
            // of a dropdown.
            window.history.replaceState({}, '', `/?${params}`);
        } catch (error) {
            container.innerHTML = `<p class="alert">${error.message}</p>`;
        } finally {
            container.removeAttribute('aria-busy');
        }
    }

    // 'change' fires as soon as a dropdown value changes, so there is nothing
    // to click.
    filters.addEventListener('change', refresh);

    // Catch the Enter key too, and stop the browser from doing its default
    // full-page submit.
    filters.addEventListener('submit', (event) => {
        event.preventDefault();
        refresh();
    });
}
