/**
 * Every request the browser makes to *this app* lives here.
 *
 * Worth noticing: none of these talk to Canvas. The browser asks this app, and
 * this app asks Canvas with the token that never leaves the server. If the
 * browser held the token, anyone who opened the developer tools would have your
 * Canvas password.
 */

/**
 * Ask the server to render the assignment list and hand back the HTML.
 *
 * This returns HTML rather than JSON so the markup for a row stays in one
 * place: views/partials/assignment-item.ejs. The browser never builds a row.
 * @param {URLSearchParams} params The current filters, e.g. days and course.
 * @returns {Promise<string>} The rendered list.
 * @throws {Error} When the server could not produce the list.
 */
export async function fetchAssignmentListHtml(params) {
    const response = await fetch(`/partials/assignments?${params}`);

    // A 502 here means the server reached Canvas and Canvas said no. The body
    // is still a usable fragment explaining that, so show it.
    if (!response.ok && response.status !== 502) {
        throw new Error(`The server could not load your assignments (status ${response.status}).`);
    }
    return response.text();
}

/**
 * Fetch the assignments as JSON.
 *
 * Nothing in the page uses this -- the list arrives as HTML -- but it is the
 * same data the app's own API serves, and it is here as the seam another
 * program would use.
 * @param {URLSearchParams} params The filters to apply.
 * @returns {Promise<object[]>} The assignments.
 */
export async function fetchAssignments(params) {
    const response = await fetch(`/api/assignments?${params}`);
    if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.error ?? `Request failed with status ${response.status}`);
    }
    return response.json();
}
