/**
 * Every call to the REST API lives here.
 *
 * Keeping the fetch() calls in one file means the rest of your front end never
 * has to remember URLs, HTTP verbs, or headers -- it just calls
 * `createTodo('milk')` and gets a todo back.
 *
 * The URLs are relative ('/api/todos'), so the same code works at
 * http://localhost:3000 and at your EC2 server's address.
 */

/**
 * Send a request and unwrap the JSON response.
 * @param {string} url The URL to request.
 * @param {RequestInit} [options] Extra fetch options (method, body, ...).
 * @returns {Promise<any>} The parsed JSON body, or null for a 204 response.
 * @throws {Error} When the server responds with a 4xx or 5xx status.
 */
async function request(url, options = {}) {
    const response = await fetch(url, options);

    // fetch() only rejects on network failure. A 404 or a 500 is a *successful*
    // fetch as far as the browser is concerned, so we have to check ourselves.
    if (!response.ok) {
        let message = `Request failed with status ${response.status}`;
        try {
            const body = await response.json();
            if (body && body.error) {
                message = body.error;
            }
        } catch {
            // The error body was not JSON. Keep the generic message.
        }
        throw new Error(message);
    }

    // 204 No Content has an empty body, so there is nothing to parse.
    if (response.status === 204) {
        return null;
    }
    return response.json();
}

/**
 * Fetch every todo.
 * @returns {Promise<object[]>} The list of todos.
 */
export async function fetchTodos() {
    return request('/api/todos');
}

/**
 * Ask the server to render the todo list and hand back the HTML.
 *
 * This one is not part of the REST API -- it returns HTML, not JSON. It exists
 * so the browser never has to build a todo row itself; the EJS template in
 * views/partials/todo-list.ejs stays the single source of that markup.
 * @returns {Promise<string>} The rendered `<ul>` and summary line.
 */
export async function fetchTodoListHtml() {
    const response = await fetch('/partials/todos');
    if (!response.ok) {
        throw new Error(`Could not load the list (status ${response.status})`);
    }
    return response.text();
}

/**
 * Create a todo.
 * @param {string} title The title to store.
 * @returns {Promise<object>} The todo the server created, including its id.
 */
export async function createTodo(title) {
    return request('/api/todos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title }),
    });
}

/**
 * Change a todo's title and/or its done flag.
 * @param {string} id The id of the todo to update.
 * @param {{title?: string, done?: boolean}} changes The fields to change.
 * @returns {Promise<object>} The updated todo.
 */
export async function updateTodo(id, changes) {
    return request(`/api/todos/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(changes),
    });
}

/**
 * Delete a todo.
 * @param {string} id The id of the todo to delete.
 * @returns {Promise<null>} Resolves once the server confirms the delete.
 */
export async function deleteTodo(id) {
    return request(`/api/todos/${id}`, { method: 'DELETE' });
}
