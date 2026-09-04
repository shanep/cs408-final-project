# Simple Full Stack App

A small todo application built the way most web apps are built: a **REST API**
on the server, a **web front end** in the browser, and the two talking over
HTTP with JSON.

It is deliberately small and deliberately plain. There is no React and no build
step — everything here is HTML, CSS, JavaScript, and two small libraries
(Express and EJS). Read it, break it, and use it as the starting point for your
own app.

## What you get

- A REST API with the five operations every CRUD app needs
- Server-side templating with EJS: shared partials and pages rendered from data
- A front end that talks to that API with `fetch`
- Tests for both halves
- Scripts that configure an EC2 server and deploy to it

## Getting started

You need [Node.js](https://nodejs.org/) 20 or newer (`node --version` to check).

```bash
npm install     # download Express
npm run dev     # start the server, restarting when you save a file
```

Open <http://localhost:3000>. Add a todo, check it off, delete it. Then refresh
the page — the todos are still there, because they live on the server, not in
the browser.

Use `npm start` when you just want to run it without the auto-restart.

## How the pieces fit together

```
Browser                          Server (Node.js)
+---------------------+          +--------------------------------+
| the page            |   HTML   | server/server.js   start it    |
| js/ui.js   the DOM  | <------- | server/app.js      wiring      |
| js/api.js  fetch    |          | routes/pages.js    HTML pages  |
| js/main.js logic    |   JSON   | routes/todos.js    the API     |
|                     | <------> | server/validate.js checks      |
+---------------------+          | server/store.js    storage     |
                                 +--------------------------------+
                                      |                  |
                              views/*.ejs         data/todos.json
```

One Node process does three jobs: it renders HTML from the templates in
`views/`, it serves the CSS and JavaScript in `public/`, and it answers API
requests under `/api`. That is why the front end can use a relative URL like
`/api/todos` and never has to know the server's address.

## Project layout

```
views/             EJS templates -- the HTML is generated from these
  index.ejs          the todo page
  about.ejs          a second page, sharing the same partials
  404.ejs            shown for an unknown URL
  partials/
    head.ejs         the <head> and opening <body>
    header.ejs       the nav, on every page
    footer.ejs       the closing markup
    todo-list.ejs    the <ul> and the summary line
    todo-item.ejs    one todo row -- the only copy of this markup
public/            everything the browser downloads as-is
  css/style.css      the styles
  js/main.js         pure logic, no DOM and no network (easy to test)
  js/api.js          every fetch call to the REST API
  js/ui.js           the only file that touches the DOM
server/            everything that runs in Node
  server.js          entry point: starts listening
  app.js             builds the Express app and its middleware
  routes/pages.js    the routes that render HTML
  routes/todos.js    the REST endpoints
  validate.js        input checking, kept pure so it is easy to test
  store.js           reads and writes data/todos.json
test/              tests for both halves
  test.html          open in a browser to run the QUnit tests
  test.js            tests for public/js/main.js
  api.test.js        tests for the REST API
  validate.test.js   tests for server/validate.js
deploy/            scripts and config for putting it on EC2
data/              todos.json lives here (not committed)
```

## Templating with EJS

The HTML is not a static file. Express renders it from the templates in
`views/` every time someone loads a page, filling in the current data:

```js
// server/routes/pages.js
router.get('/', async (request, response) => {
    const todos = await store.listTodos();
    response.render('index', { title: 'My Todos', todos, summary: summarize(todos) });
});
```

Everything you pass to `render` becomes a variable inside the template.

### The four tags

An EJS file is HTML with small pieces of JavaScript in it. There are only four
tags, and each one closes with `%` followed by `>`:

| Tag    | What it does                                                  |
| ------ | ------------------------------------------------------------- |
| `<%`   | run JavaScript, print nothing — `if`, `forEach`, and friends   |
| `<%=`  | print a value, **escaped** — use this for anything a user typed |
| `<%-`  | print a value, **raw** — only for HTML you generated yourself   |
| `<%#`  | a comment, never sent to the browser                           |

The difference between `<%=` and `<%-` is a security decision, not a style one.
Name a todo `<script>alert('hi')</script>` and try it: `<%=` shows those
characters on the page, `<%-` would run them. That is a cross-site scripting
(XSS) bug, and escaping by default is how you avoid it. There is a test for this
in `test/api.test.js`.

Two traps worth knowing about before you hit them:

- A comment ends at the *first* close tag EJS finds, and the scanner notices
  every `<%` in the file — so you cannot write EJS tags inside an EJS comment.
- Put a tag *inside* an attribute's quotes (`aria-current="<%= ... %>"`), not
  around the whole attribute. `<%=` escapes quote characters, so printing
  `aria-current="page"` from a tag produces a broken attribute.

### Partials

A partial is just a template included by another one. `include` takes the file
to pull in and the data it can see — a partial does **not** inherit the
surrounding variables:

```ejs
<%- include('partials/todo-item', { todo: todo }) %>
```

`head.ejs`, `header.ejs`, and `footer.ejs` are what make `index.ejs`,
`about.ejs`, and `404.ejs` look like one site: change the nav once and all
three pages get it.

### Who renders what

The list is rendered by the server on first load, so the page is complete
before any JavaScript runs. After that the browser handles clicks, and here is
the part worth copying:

```
add a todo -> POST /api/todos        (the REST API changes the data)
           -> GET  /partials/todos   (the server re-renders the list)
           -> drop that HTML into the page
```

`public/js/ui.js` never builds a `<li>`. The markup for a todo row is written
once, in `views/partials/todo-item.ejs`, and both the first page load and every
later update go through it. Duplicating that markup in JavaScript is the usual
way these two halves drift apart.

## The REST API

| Method   | URL               | Body                            | Success        |
| -------- | ----------------- | ------------------------------- | -------------- |
| `GET`    | `/api/todos`      | —                               | `200` array    |
| `POST`   | `/api/todos`      | `{"title": "Buy milk"}`         | `201` todo     |
| `GET`    | `/api/todos/:id`  | —                               | `200` todo     |
| `PUT`    | `/api/todos/:id`  | `{"title": "...", "done": true}`| `200` todo     |
| `DELETE` | `/api/todos/:id`  | —                               | `204` no body  |
| `GET`    | `/api/health`     | —                               | `200` status   |

The API is only half the routes. These return HTML instead:

| Method | URL                | Renders                       |
| ------ | ------------------ | ----------------------------- |
| `GET`  | `/`                | `views/index.ejs`             |
| `GET`  | `/about`           | `views/about.ejs`             |
| `GET`  | `/partials/todos`  | `views/partials/todo-list.ejs` (a fragment, not a page) |

A todo looks like this:

```json
{
  "id": "3f1c...",
  "title": "Buy milk",
  "done": false,
  "createdAt": "2025-09-04T16:30:20.623Z"
}
```

Errors come back as `{"error": "..."}` with `400` when you send something
invalid and `404` when the id does not exist.

Try it from the command line while the server is running:

```bash
curl http://localhost:3000/api/todos

curl -X POST http://localhost:3000/api/todos \
  -H 'Content-Type: application/json' \
  -d '{"title":"Finish lab 3"}'
```

## Where the data lives

`server/store.js` keeps the todos in `data/todos.json`. That keeps the setup to
zero, but it is the first thing you should replace in a real project: it holds
everything in one file and would fall over with many users writing at once.

Because every other file talks to the store through `listTodos`, `createTodo`,
`updateTodo`, and `deleteTodo`, swapping in SQLite, Postgres, or DynamoDB means
rewriting that one file and nothing else. That is not an accident — it is the
reason to put your storage behind a small set of functions.

## Tests

**Server tests** use Node's built-in test runner, so there is nothing extra to
install:

```bash
npm test
```

These start the real Express app on a random port, make real HTTP requests, and
check the status codes and JSON that come back.

**Browser tests** use QUnit. Open `test/test.html` with the Live Server
extension (right-click the file, "Open with Live Server"). They cover the pure
functions in `public/js/main.js`. Live Server is needed rather than opening the
file directly because ES modules do not load from a `file://` URL.

Notice the split: `main.js` holds functions that only move data around, so they
can be tested without a browser or a server. `ui.js` holds the DOM code, which
is much harder to test. Pushing logic out of the DOM layer and into plain
functions is what makes a front end testable.

## Deploying to EC2

The `deploy/` folder has everything needed to run this on a standard Amazon
Linux 2023 or Ubuntu EC2 instance.

The finished setup looks like this:

```
Internet --> :80 nginx --> :3000 node (systemd keeps it running)
```

nginx answers on port 80 and forwards to the Node app on port 3000. systemd
starts the app on boot and restarts it if it crashes. The app runs as its own
unprivileged `todo` user.

### 1. Launch an instance

- AMI: **Amazon Linux 2023** or **Ubuntu 24.04**, `t2.micro`/`t3.micro` is plenty
- Key pair: create one and save the `.pem` file
- Security group inbound rules:
  - **SSH (22)** from **My IP**
  - **HTTP (80)** from **Anywhere (0.0.0.0/0)**

Do **not** open port 3000 to the internet. Only nginx needs to reach it, and it
does so from inside the machine.

Make sure your key file is private, or SSH will refuse to use it:

```bash
chmod 400 ~/keys/webdev.pem
```

### 2. Configure the server (once)

```bash
scp -i ~/keys/webdev.pem -r deploy ec2-user@<PUBLIC-IP>:~
ssh -i ~/keys/webdev.pem ec2-user@<PUBLIC-IP>
sudo bash deploy/setup-ec2.sh
```

`setup-ec2.sh` installs Node.js and nginx, creates the `todo` service account
and `/opt/todo-app`, installs the systemd service and the nginx config, and
enables both. (On an Ubuntu AMI the login user is `ubuntu`, not `ec2-user`.)

### 3. Deploy your code (every time you change it)

From the project folder on your own machine:

```bash
./deploy/deploy.sh -h <PUBLIC-IP> -i ~/keys/webdev.pem
```

That runs the tests, copies the source with `rsync`, installs production
dependencies on the server, restarts the service, and checks `/api/health`. Add
`-u ubuntu` for an Ubuntu instance.

Then open `http://<PUBLIC-IP>` in a browser.

### Debugging a server that will not start

```bash
sudo systemctl status todo-app     # is it running, and why not?
journalctl -u todo-app -n 50       # the last 50 log lines
journalctl -u todo-app -f          # follow the logs live
sudo nginx -t                      # is the nginx config valid?
curl localhost:3000/api/health     # is Node up, ignoring nginx?
```

If `curl localhost:3000/api/health` works on the server but the public IP does
not answer in your browser, the problem is almost always the security group.

## Ideas for extending it

- Add a due date to each todo and sort by it
- Add filter buttons (all / active / done) using the functions in `main.js`
- Add a page at `/todos/:id` that renders one todo with its own template
- Replace the JSON file in `store.js` with SQLite
- Add users and login, so everyone sees only their own todos
- Add a domain name and HTTPS with certbot
