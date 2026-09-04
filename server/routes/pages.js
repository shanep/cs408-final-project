/**
 * The routes that return HTML pages, rendered from the EJS templates in views/.
 *
 * Compare this with routes/todos.js. Same data, two audiences:
 *   - routes/todos.js  answers with JSON, for programs (fetch, curl, a phone app)
 *   - this file        answers with HTML, for people looking at a browser
 */

import express from 'express';
import * as store from '../store.js';
// These are plain functions with no DOM and no network in them, so the server
// can import the very same file the browser downloads. Write a function once,
// use it in both places -- another payoff for keeping logic out of the UI code.
import { sortTodos, summarize } from '../../public/js/main.js';

const router = express.Router();

/**
 * Gather everything the todo list template needs.
 * @returns {Promise<{todos: object[], summary: string}>} The data for views/partials/todo-list.ejs.
 */
async function todoListData() {
    const todos = await store.listTodos();
    return {
        todos: sortTodos(todos),
        summary: summarize(todos),
    };
}

// GET / -> the todo page, with the list already rendered into the HTML.
router.get('/', async (request, response) => {
    const data = await todoListData();
    // render(view, data) finds views/index.ejs, runs it with `data`, and sends
    // the resulting HTML. Everything in `data` becomes a variable inside the
    // template.
    response.render('index', {
        title: 'My Todos',
        current: 'home',
        ...data,
    });
});

// GET /about -> a second page, sharing the same partials.
router.get('/about', async (request, response) => {
    const todos = await store.listTodos();
    response.render('about', {
        title: 'About',
        current: 'about',
        todoCount: todos.length,
    });
});

// GET /partials/todos -> just the list, as an HTML fragment.
//
// After the browser adds, checks off, or deletes a todo it asks for this and
// drops the result into the page. That way the markup for a todo row is written
// exactly once, in views/partials/todo-item.ejs, instead of once in a template
// and again in JavaScript.
router.get('/partials/todos', async (request, response) => {
    const data = await todoListData();
    response.render('partials/todo-list', data);
});

export default router;
