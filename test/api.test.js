/**
 * Server tests for the REST API.
 *
 * These use Node's built-in test runner -- no extra libraries to install. Run
 * them with `npm run test:api`.
 *
 * Each test starts the real Express app on a random free port (port 0 means
 * "pick one for me") and talks to it with fetch, exactly like the browser does.
 * A temporary data file keeps the tests from stomping on your real todos.
 */

import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { after, before, beforeEach, describe, it } from 'node:test';

// The store reads process.env.DATA_FILE when it is first imported, so point it
// at a scratch file *before* importing the app.
const TEST_DIR = await fs.mkdtemp(path.join(os.tmpdir(), 'todo-test-'));
const TEST_FILE = path.join(TEST_DIR, 'todos.json');
process.env.DATA_FILE = TEST_FILE;

const { createApp } = await import('../server/app.js');

/** @type {import('node:http').Server} */
let server;
/** @type {string} The base URL of the test server, e.g. http://127.0.0.1:51234 */
let baseUrl;

/**
 * Call the API and return both the status and the parsed body.
 * @param {string} url The path to request, e.g. '/api/todos'.
 * @param {RequestInit} [options] Extra fetch options.
 * @returns {Promise<{status: number, body: any}>} The response status and body.
 */
async function api(url, options = {}) {
    const response = await fetch(`${baseUrl}${url}`, options);
    const text = await response.text();
    return { status: response.status, body: text ? JSON.parse(text) : null };
}

/**
 * POST a todo and return it.
 * @param {string} title The title to create.
 * @returns {Promise<any>} The created todo.
 */
async function addTodo(title) {
    const { body } = await api('/api/todos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title }),
    });
    return body;
}

before(async () => {
    server = createApp().listen(0);
    await new Promise((resolve) => server.once('listening', resolve));
    baseUrl = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
    await new Promise((resolve) => server.close(resolve));
    await fs.rm(TEST_DIR, { recursive: true, force: true });
});

beforeEach(async () => {
    // Start every test from an empty list so the tests cannot affect each other.
    await fs.writeFile(TEST_FILE, '[]', 'utf8');
});

describe('GET /api/todos', () => {

    it('returns an empty array when there are no todos', async () => {
        const { status, body } = await api('/api/todos');
        assert.equal(status, 200);
        assert.deepEqual(body, []);
    });

    it('returns the todos that have been created', async () => {
        await addTodo('Read chapter 4');
        const { status, body } = await api('/api/todos');
        assert.equal(status, 200);
        assert.equal(body.length, 1);
        assert.equal(body[0].title, 'Read chapter 4');
    });

});

describe('POST /api/todos', () => {

    it('creates a todo and responds 201', async () => {
        const { status, body } = await api('/api/todos', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title: 'Buy milk' }),
        });
        assert.equal(status, 201);
        assert.equal(body.title, 'Buy milk');
        assert.equal(body.done, false);
        assert.ok(body.id, 'the server assigns an id');
    });

    it('trims whitespace off the title', async () => {
        const todo = await addTodo('   spaced out   ');
        assert.equal(todo.title, 'spaced out');
    });

    it('rejects an empty title with 400', async () => {
        const { status, body } = await api('/api/todos', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title: '   ' }),
        });
        assert.equal(status, 400);
        assert.ok(body.error, 'the response explains what went wrong');
    });

    it('rejects a missing title with 400', async () => {
        const { status } = await api('/api/todos', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({}),
        });
        assert.equal(status, 400);
    });

});

describe('GET /api/todos/:id', () => {

    it('returns one todo', async () => {
        const created = await addTodo('Walk the dog');
        const { status, body } = await api(`/api/todos/${created.id}`);
        assert.equal(status, 200);
        assert.equal(body.id, created.id);
    });

    it('responds 404 for an unknown id', async () => {
        const { status } = await api('/api/todos/does-not-exist');
        assert.equal(status, 404);
    });

});

describe('PUT /api/todos/:id', () => {

    it('marks a todo done', async () => {
        const created = await addTodo('Submit lab');
        const { status, body } = await api(`/api/todos/${created.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ done: true }),
        });
        assert.equal(status, 200);
        assert.equal(body.done, true);
        assert.equal(body.title, 'Submit lab', 'the title is left alone');
    });

    it('renames a todo', async () => {
        const created = await addTodo('Old name');
        const { body } = await api(`/api/todos/${created.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title: 'New name' }),
        });
        assert.equal(body.title, 'New name');
    });

    it('rejects a body with nothing to change', async () => {
        const created = await addTodo('Unchanged');
        const { status } = await api(`/api/todos/${created.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({}),
        });
        assert.equal(status, 400);
    });

    it('responds 404 for an unknown id', async () => {
        const { status } = await api('/api/todos/does-not-exist', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ done: true }),
        });
        assert.equal(status, 404);
    });

});

describe('DELETE /api/todos/:id', () => {

    it('deletes a todo and responds 204', async () => {
        const created = await addTodo('Temporary');
        const { status } = await api(`/api/todos/${created.id}`, { method: 'DELETE' });
        assert.equal(status, 204);

        const list = await api('/api/todos');
        assert.deepEqual(list.body, [], 'the todo is gone');
    });

    it('responds 404 for an unknown id', async () => {
        const { status } = await api('/api/todos/does-not-exist', { method: 'DELETE' });
        assert.equal(status, 404);
    });

});

describe('other routes', () => {

    it('reports health', async () => {
        const { status, body } = await api('/api/health');
        assert.equal(status, 200);
        assert.equal(body.status, 'ok');
    });

    it('responds 404 in JSON for an unknown API route', async () => {
        const { status, body } = await api('/api/nope');
        assert.equal(status, 404);
        assert.ok(body.error);
    });

});

describe('HTML pages', () => {

    it('renders the todo page with the list already filled in', async () => {
        await addTodo('Server rendered me');
        const response = await fetch(`${baseUrl}/`);
        assert.equal(response.status, 200);

        const html = await response.text();
        assert.ok(html.includes('<title>My Todos</title>'), 'the page has a title');
        // The proof that EJS rendered on the server: the todo is in the HTML
        // before any JavaScript has run.
        assert.ok(html.includes('Server rendered me'), 'the todo is in the HTML');
    });

    it('escapes anything the user typed', async () => {
        await addTodo('<script>alert(1)</script>');
        const html = await (await fetch(`${baseUrl}/`)).text();
        assert.ok(!html.includes('<script>alert(1)</script>'), 'the raw tag is not in the page');
        assert.ok(html.includes('&lt;script&gt;'), 'it was escaped instead');
    });

    it('shows the summary line rendered on the server', async () => {
        await addTodo('One');
        await addTodo('Two');
        const html = await (await fetch(`${baseUrl}/`)).text();
        assert.ok(html.includes('2 of 2 remaining'), 'the summary is rendered');
    });

    it('renders the about page with the shared partials', async () => {
        await addTodo('Counted');
        const response = await fetch(`${baseUrl}/about`);
        assert.equal(response.status, 200);

        const html = await response.text();
        assert.ok(html.includes('<title>About</title>'));
        // The nav comes from the same partial the todo page uses.
        assert.ok(html.includes('href="/about"'), 'the shared nav is present');
        assert.ok(html.includes('<strong>1</strong>'), 'the todo count is rendered');
    });

    it('renders an HTML fragment at /partials/todos', async () => {
        await addTodo('Fragment');
        const response = await fetch(`${baseUrl}/partials/todos`);
        assert.equal(response.status, 200);

        const html = await response.text();
        assert.ok(html.includes('Fragment'), 'the todo is in the fragment');
        assert.ok(html.includes('<ul id="todo-list"'), 'the list is there');
        // A fragment, not a whole page -- that is what makes it droppable
        // straight into the existing page.
        assert.ok(!html.includes('<!doctype html>'), 'no page wrapper');
    });

    it('renders a 404 page for an unknown URL', async () => {
        const response = await fetch(`${baseUrl}/nowhere`);
        assert.equal(response.status, 404);

        const html = await response.text();
        assert.ok(html.includes('Page not found'));
    });

});
