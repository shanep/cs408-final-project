/**
 * The entry point: build the app and start listening.
 *
 * Run it with `npm start` (or `npm run dev` to restart automatically when you
 * save a file).
 */

import { createApp } from './app.js';

// Read the port from the environment so the same code works on your laptop and
// on EC2, where systemd sets PORT for us. Fall back to 3000 for development.
const PORT = Number(process.env.PORT) || 3000;

const app = createApp();

app.listen(PORT, () => {
    console.log(`Todo app listening on http://localhost:${PORT}`);
});
