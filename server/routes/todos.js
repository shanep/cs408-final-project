/**
 * The REST API for todos.
 *
 * Every route follows the same three steps:
 *   1. Validate what the client sent.
 *   2. Ask the store to do the work.
 *   3. Reply with a status code and JSON.
 *
 * Status codes matter in a REST API -- the client uses them to decide what to
 * do next, so pick them deliberately:
 *   200 OK          the request worked and there is a body
 *   201 Created     a new resource exists; its URL is in the Location header
 *   204 No Content  the request worked and there is nothing to send back
 *   400 Bad Request the client sent something invalid
 *   404 Not Found   there is no resource with that id
 */

import express from 'express';
import * as store from '../store.js';
import { validateNewTodo, validateTodoUpdate } from '../validate.js';

// A Router is a mini Express app. server.js mounts this one under /api/todos,
// so the '/' route below is really GET /api/todos.
const router = express.Router();

// GET /api/todos -> the whole list
router.get('/', async (request, response) => {
    const todos = await store.listTodos();
    response.json(todos);
});

// GET /api/todos/:id -> one todo
router.get('/:id', async (request, response) => {
    const todo = await store.getTodo(request.params.id);
    if (!todo) {
        return response.status(404).json({ error: 'todo not found' });
    }
    response.json(todo);
});

// POST /api/todos -> create a todo from { "title": "..." }
router.post('/', async (request, response) => {
    const check = validateNewTodo(request.body);
    if (!check.valid) {
        return response.status(400).json({ error: check.error });
    }
    const todo = await store.createTodo(check.value.title);
    // 201 Created, plus a Location header pointing at the new resource.
    response.status(201).location(`/api/todos/${todo.id}`).json(todo);
});

// PUT /api/todos/:id -> change the title and/or the done flag
router.put('/:id', async (request, response) => {
    const check = validateTodoUpdate(request.body);
    if (!check.valid) {
        return response.status(400).json({ error: check.error });
    }
    const todo = await store.updateTodo(request.params.id, check.value);
    if (!todo) {
        return response.status(404).json({ error: 'todo not found' });
    }
    response.json(todo);
});

// DELETE /api/todos/:id -> remove a todo
router.delete('/:id', async (request, response) => {
    const deleted = await store.deleteTodo(request.params.id);
    if (!deleted) {
        return response.status(404).json({ error: 'todo not found' });
    }
    // Nothing useful to send back, so 204 with an empty body.
    response.status(204).end();
});

export default router;
