/**
 * The browser half of the app.
 *
 * The server already rendered the todo list into the page (see views/), so
 * there is nothing to draw when this file loads. Its job is to react to what
 * the user does:
 *
 *   1. Send the change to the REST API.
 *   2. Ask the server for a freshly rendered list.
 *   3. Swap that HTML into the page.
 *
 * Step 2 is why this file has no code that builds a <li>. The markup for a todo
 * row is written once, in views/partials/todo-item.ejs, and both the first page
 * load and every update use it.
 */

import { createTodo, deleteTodo, fetchTodoListHtml, updateTodo } from './api.js';
import { isValidTitle } from './main.js';

// Grab the elements once, up front, instead of searching the page every time.
const form = document.querySelector('#new-todo-form');
const input = document.querySelector('#new-todo-input');
const container = document.querySelector('#todo-container');
const errorMessage = document.querySelector('#error');

/**
 * Show a problem to the user, or clear the last one.
 * @param {string} message The text to show. Pass '' to hide the message.
 * @returns {void}
 */
function setError(message) {
    errorMessage.textContent = message;
    // `hidden` is a real HTML attribute; the browser hides the element for us.
    errorMessage.hidden = message === '';
}

/**
 * Replace the list on the page with a freshly rendered one from the server.
 * @returns {Promise<void>} Resolves once the new HTML is on screen.
 */
async function refreshList() {
    // The server built this HTML from our own EJS template and escaped every
    // title on the way out, so it is safe to insert.
    container.innerHTML = await fetchTodoListHtml();
}

// Adding a todo. 'submit' fires for the Add button and for the Enter key.
form.addEventListener('submit', async (event) => {
    // Stop the browser from reloading the page, which is its default behavior
    // for a form submit.
    event.preventDefault();

    const title = input.value;
    // The server checks this too -- never trust the browser alone -- but
    // checking here saves a round trip and answers the user faster.
    if (!isValidTitle(title)) {
        setError('Type something first.');
        return;
    }

    try {
        await createTodo(title.trim());
        input.value = '';
        input.focus();
        setError('');
        await refreshList();
    } catch (error) {
        setError(`Could not add todo: ${error.message}`);
    }
});

// One listener on the container handles every checkbox and Delete button,
// including the ones that arrive later inside new HTML. This is called event
// delegation, and it is the reason replacing the list wholesale does not break
// anything: the listener lives on the parent, which never gets replaced.
container.addEventListener('click', async (event) => {
    const target = event.target;
    const action = target.dataset.action;
    if (!action) {
        return;
    }

    // Walk up to the <li> to read the id the template put in data-id.
    const id = target.closest('.todo').dataset.id;

    try {
        if (action === 'toggle') {
            await updateTodo(id, { done: target.checked });
        } else if (action === 'delete') {
            await deleteTodo(id);
        }
        setError('');
    } catch (error) {
        setError(`Could not update todo: ${error.message}`);
    }

    // Refresh either way: on success to show the change, and on failure to
    // put the screen back in step with what the server actually has.
    await refreshList();
});
