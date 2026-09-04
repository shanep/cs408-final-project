/**
 * Browser tests for the pure functions in public/js/main.js.
 *
 * Open test/test.html in a browser (Live Server works well) to run them.
 * Only functions that avoid the DOM and the network can be tested this way,
 * which is exactly why main.js keeps them separate.
 */

import { countRemaining, isValidTitle, sortTodos, summarize } from '../public/js/main.js';

/**
 * Build a todo for a test.
 * @param {object} overrides Fields to override on the default todo.
 * @returns {object} A todo object.
 */
function makeTodo(overrides = {}) {
    return {
        id: 'test-id',
        title: 'Write some code',
        done: false,
        createdAt: '2025-01-01T00:00:00.000Z',
        ...overrides,
    };
}

QUnit.module('isValidTitle', function() {

    QUnit.test('accepts a normal title', function(assert) {
        assert.true(isValidTitle('Buy milk'), 'a real title is valid');
    });

    QUnit.test('rejects an empty or whitespace-only title', function(assert) {
        assert.false(isValidTitle(''), 'the empty string is not valid');
        assert.false(isValidTitle('   '), 'spaces alone are not valid');
    });

    QUnit.test('rejects values that are not strings', function(assert) {
        assert.false(isValidTitle(undefined), 'undefined is not valid');
        assert.false(isValidTitle(42), 'a number is not valid');
    });

});

QUnit.module('countRemaining', function() {

    QUnit.test('returns 0 for an empty list', function(assert) {
        assert.equal(countRemaining([]), 0, 'no todos means nothing remaining');
    });

    QUnit.test('counts only the todos that are not done', function(assert) {
        //Arrange
        const todos = [
            makeTodo({ id: '1', done: false }),
            makeTodo({ id: '2', done: true }),
            makeTodo({ id: '3', done: false }),
        ];
        //Act
        const result = countRemaining(todos);
        //Assert
        assert.equal(result, 2, 'two of the three todos are still open');
    });

});

QUnit.module('sortTodos', function() {

    QUnit.test('puts unfinished todos before finished ones', function(assert) {
        //Arrange
        const todos = [
            makeTodo({ id: 'done', done: true, createdAt: '2025-01-01T00:00:00.000Z' }),
            makeTodo({ id: 'open', done: false, createdAt: '2025-01-02T00:00:00.000Z' }),
        ];
        //Act
        const result = sortTodos(todos);
        //Assert
        assert.equal(result[0].id, 'open', 'the open todo comes first');
        assert.equal(result[1].id, 'done', 'the finished todo comes last');
    });

    QUnit.test('sorts todos of the same state oldest first', function(assert) {
        //Arrange
        const todos = [
            makeTodo({ id: 'newer', createdAt: '2025-02-01T00:00:00.000Z' }),
            makeTodo({ id: 'older', createdAt: '2025-01-01T00:00:00.000Z' }),
        ];
        //Act
        const result = sortTodos(todos);
        //Assert
        assert.equal(result[0].id, 'older', 'the older todo comes first');
    });

    QUnit.test('does not modify the array it was given', function(assert) {
        //Arrange
        const todos = [
            makeTodo({ id: 'done', done: true }),
            makeTodo({ id: 'open', done: false }),
        ];
        //Act
        sortTodos(todos);
        //Assert
        assert.equal(todos[0].id, 'done', 'the original array is untouched');
    });

});

QUnit.module('summarize', function() {

    QUnit.test('nudges the user when there are no todos', function(assert) {
        assert.true(summarize([]).includes('Nothing here yet'), 'shows the empty message');
    });

    QUnit.test('reports how many are left', function(assert) {
        //Arrange
        const todos = [makeTodo({ id: '1' }), makeTodo({ id: '2', done: true })];
        //Act
        const result = summarize(todos);
        //Assert
        assert.equal(result, '1 of 2 remaining', 'counts the open todos');
    });

    QUnit.test('celebrates when everything is done', function(assert) {
        //Arrange
        const todos = [makeTodo({ id: '1', done: true })];
        //Act
        const result = summarize(todos);
        //Assert
        assert.true(result.includes('All 1 done'), 'shows the finished message');
    });

});
