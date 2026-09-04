/**
 * Pure browser-side logic.
 *
 * This file should only contain functions that don't interact with the DOM.
 * That means no document.querySelector, no document.getElementById, and no
 * fetch. Functions here just take data in and hand data back, which is exactly
 * what makes them easy to test (see test/test.js).
 *
 * The DOM work lives in ui.js and the network calls live in api.js.
 */

/**
 * @typedef {object} Todo
 * @property {string} id A unique id for the todo.
 * @property {string} title What the user typed.
 * @property {boolean} done Whether the todo is checked off.
 * @property {string} createdAt When it was created (ISO 8601 string).
 */

/**
 * Decide whether a title typed by the user is worth sending to the server.
 * The server checks this too -- never trust the browser alone -- but checking
 * here saves a round trip and gives faster feedback.
 * @param {string} title The raw text from the input box.
 * @returns {boolean} True when the title has at least one non-space character.
 */
export function isValidTitle(title) {
    return typeof title === 'string' && title.trim().length > 0;
}

/**
 * Count how many todos are still open.
 * @param {Todo[]} todos The list of todos.
 * @returns {number} How many are not done.
 */
export function countRemaining(todos) {
    return todos.filter((todo) => !todo.done).length;
}

/**
 * Put unfinished todos first, then sort each group oldest to newest, so newly
 * added work shows up at the bottom of the open list.
 * @param {Todo[]} todos The list of todos.
 * @returns {Todo[]} A new sorted array. The input array is left alone.
 */
export function sortTodos(todos) {
    // Copy first: sort() rearranges the array you give it, and surprising your
    // caller by rewriting their data is a good way to create a hard bug.
    return [...todos].sort((a, b) => {
        if (a.done !== b.done) {
            return a.done ? 1 : -1;
        }
        return a.createdAt.localeCompare(b.createdAt);
    });
}

/**
 * Build the sentence shown under the list, e.g. "2 of 5 remaining".
 * @param {Todo[]} todos The list of todos.
 * @returns {string} A short human readable summary.
 */
export function summarize(todos) {
    if (todos.length === 0) {
        return 'Nothing here yet. Add your first todo above.';
    }
    const remaining = countRemaining(todos);
    if (remaining === 0) {
        return `All ${todos.length} done. Nice work!`;
    }
    return `${remaining} of ${todos.length} remaining`;
}
