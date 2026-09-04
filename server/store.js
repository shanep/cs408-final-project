/**
 * The "database" layer.
 *
 * A real application would talk to Postgres, MySQL, DynamoDB, etc. To keep the
 * moving parts down we store the todos in a single JSON file on disk. The rest
 * of the app only talks to the functions below, so when you are ready to swap
 * in a real database you only have to rewrite this one file.
 */

import { randomUUID } from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';

/**
 * @typedef {object} Todo
 * @property {string} id A unique id (UUID) for this todo.
 * @property {string} title What the user typed.
 * @property {boolean} done Whether the todo has been checked off.
 * @property {string} createdAt When the todo was created (ISO 8601 string).
 */

/** Where the JSON file lives. Override with the DATA_FILE environment variable. */
const DATA_FILE = process.env.DATA_FILE
    ? path.resolve(process.env.DATA_FILE)
    : path.join(process.cwd(), 'data', 'todos.json');

/**
 * Read every todo from disk.
 *
 * If the file does not exist yet (first run, or a fresh EC2 box) we treat that
 * as "no todos" instead of crashing.
 * @returns {Promise<Todo[]>} Every stored todo, newest last.
 */
async function readAll() {
    try {
        const text = await fs.readFile(DATA_FILE, 'utf8');
        const parsed = JSON.parse(text);
        return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
        if (error.code === 'ENOENT') {
            return [];
        }
        throw error;
    }
}

/**
 * Write every todo back to disk, creating the data directory if needed.
 * @param {Todo[]} todos The complete list to save.
 * @returns {Promise<void>} Resolves once the file has been written.
 */
async function writeAll(todos) {
    await fs.mkdir(path.dirname(DATA_FILE), { recursive: true });
    await fs.writeFile(DATA_FILE, JSON.stringify(todos, null, 2), 'utf8');
}

/**
 * List all todos.
 * @returns {Promise<Todo[]>} Every stored todo.
 */
export async function listTodos() {
    return readAll();
}

/**
 * Find a single todo by id.
 * @param {string} id The id to look for.
 * @returns {Promise<Todo|undefined>} The todo, or undefined if there is no match.
 */
export async function getTodo(id) {
    const todos = await readAll();
    return todos.find((todo) => todo.id === id);
}

/**
 * Add a new todo to the list.
 * @param {string} title The (already validated) title.
 * @returns {Promise<Todo>} The todo that was created, including its new id.
 */
export async function createTodo(title) {
    const todos = await readAll();
    /** @type {Todo} */
    const todo = {
        id: randomUUID(),
        title,
        done: false,
        createdAt: new Date().toISOString(),
    };
    todos.push(todo);
    await writeAll(todos);
    return todo;
}

/**
 * Update the title and/or the done flag of an existing todo.
 * @param {string} id The id of the todo to change.
 * @param {{title?: string, done?: boolean}} changes The (already validated) fields to change.
 * @returns {Promise<Todo|undefined>} The updated todo, or undefined if no todo has that id.
 */
export async function updateTodo(id, changes) {
    const todos = await readAll();
    const index = todos.findIndex((todo) => todo.id === id);
    if (index === -1) {
        return undefined;
    }
    // Spread the existing todo first, then the changes, so the changes win.
    const updated = { ...todos[index], ...changes };
    todos[index] = updated;
    await writeAll(todos);
    return updated;
}

/**
 * Remove a todo.
 * @param {string} id The id of the todo to delete.
 * @returns {Promise<boolean>} True if something was deleted, false if the id was unknown.
 */
export async function deleteTodo(id) {
    const todos = await readAll();
    const remaining = todos.filter((todo) => todo.id !== id);
    if (remaining.length === todos.length) {
        return false;
    }
    await writeAll(remaining);
    return true;
}
