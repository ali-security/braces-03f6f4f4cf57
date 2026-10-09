'use strict';

require('mocha');
var assert = require('assert');
var braces = require('..');

describe('.parse', function() {
  it('should return an AST object', function() {
    var ast = braces.parse('a/{b,c}/d');
    assert(ast);
    assert.equal(typeof ast, 'object');
  });

  it('should have an array of nodes', function() {
    var ast = braces.parse('a/{b,c}/d');
    assert(Array.isArray(ast.nodes));
  });

  describe('nesting depth', function() {
    function repeat(str, n) {
      return new Array(n + 1).join(str);
    }

    it('should throw an error when nesting exceeds the maximum depth', function() {
      assert.throws(function() {
        braces.parse(repeat('{', 101) + 'a,b' + repeat('}', 101));
      }, /exceeds max depth/);
    });

    it('should count unclosed braces toward the maximum depth', function() {
      assert.throws(function() {
        braces.parse(repeat('{', 101) + 'a,b');
      }, /exceeds max depth/);
    });

    it('should support nesting up to the maximum depth', function() {
      assert.doesNotThrow(function() {
        braces.parse(repeat('{', 100) + 'a,b' + repeat('}', 100));
      });
    });

    it('should not count sibling braces toward the maximum depth', function() {
      assert.doesNotThrow(function() {
        braces.parse(repeat('{a,b}', 200));
      });
    });

    it('should support a lower maximum depth', function() {
      assert.throws(function() {
        braces.parse('{{a,b},c}', {maxDepth: 1});
      }, /exceeds max depth/);
      assert.doesNotThrow(function() {
        braces.parse('{{a,b},c}', {maxDepth: 2});
      });
    });

    it('should not allow options.maxDepth to raise the maximum depth', function() {
      assert.throws(function() {
        braces.parse(repeat('{', 101) + 'a,b' + repeat('}', 101), {maxDepth: 1000});
      }, /exceeds max depth/);
    });
  });
});
