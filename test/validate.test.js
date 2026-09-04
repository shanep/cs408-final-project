/**
 * Server tests for the pure validation helpers.
 *
 * No server and no files involved -- just call the function and check what
 * comes back. Tests like these run in milliseconds, so write lots of them.
 */

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { MAX_TITLE_LENGTH, validateNewTodo, validateTitle, validateTodoUpdate } from '../server/validate.js';

describe('validateTitle', () => {

    it('accepts and trims a normal title', () => {
        const result = validateTitle('  Buy milk  ');
        assert.equal(result.valid, true);
        assert.equal(result.value, 'Buy milk');
    });

    it('rejects an empty title', () => {
        assert.equal(validateTitle('').valid, false);
        assert.equal(validateTitle('   ').valid, false);
    });

    it('rejects a title that is not a string', () => {
        assert.equal(validateTitle(42).valid, false);
        assert.equal(validateTitle(undefined).valid, false);
    });

    it('rejects a title that is too long', () => {
        const tooLong = 'a'.repeat(MAX_TITLE_LENGTH + 1);
        assert.equal(validateTitle(tooLong).valid, false);
    });

});

describe('validateNewTodo', () => {

    it('accepts a body with a title', () => {
        const result = validateNewTodo({ title: 'Study' });
        assert.equal(result.valid, true);
        assert.deepEqual(result.value, { title: 'Study' });
    });

    it('rejects a body that is not an object', () => {
        assert.equal(validateNewTodo('Study').valid, false);
        assert.equal(validateNewTodo(null).valid, false);
    });

});

describe('validateTodoUpdate', () => {

    it('accepts a done flag on its own', () => {
        const result = validateTodoUpdate({ done: true });
        assert.equal(result.valid, true);
        assert.deepEqual(result.value, { done: true });
    });

    it('accepts a title and a done flag together', () => {
        const result = validateTodoUpdate({ title: 'Renamed', done: false });
        assert.deepEqual(result.value, { title: 'Renamed', done: false });
    });

    it('rejects an empty body because there is nothing to change', () => {
        assert.equal(validateTodoUpdate({}).valid, false);
    });

    it('rejects a done flag that is not a boolean', () => {
        assert.equal(validateTodoUpdate({ done: 'yes' }).valid, false);
    });

});
