/**
 * Pure validation helpers for the todo API.
 *
 * These functions do not touch the database, the file system, or Express.
 * That makes them easy to unit test: give them an input, check the output.
 * Keeping validation separate from your route handlers is a habit worth
 * building -- the routes stay short and the rules stay testable.
 */

/** The longest title we are willing to store. */
export const MAX_TITLE_LENGTH = 200;

/**
 * Check that a value is a usable todo title.
 * @param {unknown} title The value sent by the client.
 * @returns {{valid: boolean, error?: string, value?: string}} The result of the
 *   check. When valid, `value` holds the cleaned up (trimmed) title.
 */
export function validateTitle(title) {
    if (typeof title !== 'string') {
        return { valid: false, error: 'title must be a string' };
    }
    const trimmed = title.trim();
    if (trimmed.length === 0) {
        return { valid: false, error: 'title must not be empty' };
    }
    if (trimmed.length > MAX_TITLE_LENGTH) {
        return { valid: false, error: `title must be ${MAX_TITLE_LENGTH} characters or fewer` };
    }
    return { valid: true, value: trimmed };
}

/**
 * Check the body of a POST /api/todos request.
 * @param {unknown} body The parsed JSON body.
 * @returns {{valid: boolean, error?: string, value?: {title: string}}} The result.
 */
export function validateNewTodo(body) {
    if (body === null || typeof body !== 'object') {
        return { valid: false, error: 'request body must be a JSON object' };
    }
    const titleCheck = validateTitle(/** @type {any} */ (body).title);
    if (!titleCheck.valid) {
        return { valid: false, error: titleCheck.error };
    }
    return { valid: true, value: { title: /** @type {string} */ (titleCheck.value) } };
}

/**
 * Check the body of a PUT /api/todos/:id request. Both fields are optional,
 * but at least one of them has to be present -- otherwise there is nothing
 * to update.
 * @param {unknown} body The parsed JSON body.
 * @returns {{valid: boolean, error?: string, value?: {title?: string, done?: boolean}}} The result.
 */
export function validateTodoUpdate(body) {
    if (body === null || typeof body !== 'object') {
        return { valid: false, error: 'request body must be a JSON object' };
    }
    const { title, done } = /** @type {any} */ (body);
    if (title === undefined && done === undefined) {
        return { valid: false, error: 'provide at least one of: title, done' };
    }

    /** @type {{title?: string, done?: boolean}} */
    const changes = {};

    if (title !== undefined) {
        const titleCheck = validateTitle(title);
        if (!titleCheck.valid) {
            return { valid: false, error: titleCheck.error };
        }
        changes.title = /** @type {string} */ (titleCheck.value);
    }

    if (done !== undefined) {
        if (typeof done !== 'boolean') {
            return { valid: false, error: 'done must be true or false' };
        }
        changes.done = done;
    }

    return { valid: true, value: changes };
}
