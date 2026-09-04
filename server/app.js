/**
 * Builds the Express application.
 *
 * Notice that this file never calls app.listen(). Creating the app and starting
 * the server are two different jobs: server.js starts it for real, and the
 * tests start it on a random port. Splitting them keeps the tests fast and
 * means you never have to hard-code port 3000 in a test.
 */

import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import pagesRouter from './routes/pages.js';
import todosRouter from './routes/todos.js';

// ESM does not give us __dirname for free, so we rebuild it from import.meta.url.
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.join(__dirname, '..');
const PUBLIC_DIR = path.join(ROOT_DIR, 'public');
const VIEWS_DIR = path.join(ROOT_DIR, 'views');

/**
 * Create a configured Express app.
 * @returns {import('express').Express} The app, ready for listen() or a test.
 */
export function createApp() {
    const app = express();

    // --- templating ---------------------------------------------------------
    // Tell Express to render .ejs files, and where to find them. After this,
    // response.render('index', data) runs views/index.ejs and sends the HTML.
    // EJS is a template engine: HTML with small pieces of JavaScript in it.
    app.set('view engine', 'ejs');
    app.set('views', VIEWS_DIR);

    // --- middleware ---------------------------------------------------------
    // Middleware runs on every request, in the order it is registered.
    // express.json() parses a JSON request body into request.body.
    app.use(express.json());

    // A tiny logger so you can see requests in your terminal while developing.
    app.use((request, response, next) => {
        console.log(`${request.method} ${request.url}`);
        next();
    });

    // Serve the browser's files: the CSS and the JavaScript. The HTML no longer
    // lives here -- it is generated from the templates in views/.
    app.use(express.static(PUBLIC_DIR));

    // --- routes -------------------------------------------------------------
    // A health check is handy once the app is on EC2 -- hit it to see whether
    // the server is up without loading the whole page.
    app.get('/api/health', (request, response) => {
        response.json({ status: 'ok', uptime: process.uptime() });
    });

    // Everything under /api/todos is handled by the router.
    app.use('/api/todos', todosRouter);

    // Any other /api/... URL is a mistake by the client, so say so in JSON
    // rather than sending back an HTML page a program cannot use.
    app.use('/api', (request, response) => {
        response.status(404).json({ error: 'no such API endpoint' });
    });

    // The HTML pages: /, /about, and the list fragment.
    app.use('/', pagesRouter);

    // Nothing matched, so show the 404 page. A person is looking at this one,
    // so it gets HTML rather than JSON.
    app.use((request, response) => {
        response.status(404).render('404', {
            title: 'Not found',
            current: '',
            url: request.originalUrl,
        });
    });

    // The error handler goes last and takes four arguments -- that is how
    // Express recognizes it. Anything thrown in a route lands here.
    app.use((error, request, response, next) => {
        console.error(error);
        response.status(500).json({ error: 'internal server error' });
    });

    return app;
}
