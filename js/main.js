window.onload = loaded;

/**
 * Simple Function that will be run when the browser is finished loading.
 */
function loaded() {
    // Assign to a variable so we can set a breakpoint in the debugger!
    const hello = sayHello();
    console.log(hello);
}

/**
 * This function returns the string 'hello'
 * @return {string} the string hello
 */
export function sayHello() {
    return 'hello';
}

/**
 * This file should only contain functions that don't interact with the DOM.
 * That means no document.querySelector, no document.getElementById, etc.
 * This file should only contain functions that do things like calculations,
 * data manipulation, etc. This is so that we can test these functions
 * without having to worry about the DOM or the browser environment.
 */

/**
 * This function prints the string 'Hello World' to the console
 */
export function helloWorld() {
    console.log('Hello World');
}

/**
 * This function adds two numbers together and returns the sum. This demonstrates
 * how to pass parameters to a function and return a value from a function
 * from HTML.
 * @param {number} a The first number to add
 * @param {number} b The second number to add
 * @returns {number} The sum of the two numbers
 */
export function add(num1, num2) {
    if (num1 === undefined || num2 === undefined) {
        throw new Error('You must provide two numbers to add');
    }
    if (typeof num1 !== 'number' || typeof num2 !== 'number') {
        throw new Error('You must provide two numbers to add');
    }
    return num1 + num2;
}

/**
 * This function fetches a random joke from the "Official Joke API" and returns it.
 * @returns {string} A joke in the format "setup - punchline"
 */
export async function fetchRandomJoke() {
    try {
        const response = await fetch('https://official-joke-api.appspot.com/random_joke');
        if (!response.ok) {
            throw new Error('Failed to fetch a joke');
        }
        const joke = await response.json();
        return `${joke.setup} - ${joke.punchline}`;
    } catch (error) {
        throw new Error(error.message);
    }
}

export async function fetch5RandomJokes() {
    try {
        // This endpoint returns 10 jokes, so we need to slice the array to get 5
        const response = await fetch('https://official-joke-api.appspot.com/random_ten');
        if (!response.ok) {
            throw new Error('Failed to fetch a joke');
        }
        const jokes = await response.json();
        // Slice the first 5 jokes from the array
        return jokes.slice(0, 5).map(joke => `${joke.setup} - ${joke.punchline}`);
    } catch (error) {
        throw new Error(error.message);
    }
}
