'use strict';

require('mocha');
var assert = require('assert');
var braces = require('..');

describe('.compile', function() {
  it('should return an object', function() {
    var res = braces.compile('a/{b,c}/d');
    assert(res);
    assert.equal(typeof res, 'object');
  });

  it('should return output as an array', function() {
    var res = braces.compile('a/{b,c}/d');
    assert(Array.isArray(res.output));
    assert.deepEqual(res.output, ['a/(b|c)/d']);
  });

  describe('nesting depth', function() {
    function repeat(str, n) {
      return new Array(n + 1).join(str);
    }

    it('should reject deeply nested patterns', function() {
      assert.throws(function() {
        braces.compile(repeat('{', 101) + 'a,b' + repeat('}', 101));
      }, /exceeds max depth/);
    });

    it('should reject deeply nested ASTs', function() {
      var ast = {type: 'text', val: 'a'};
      for (var i = 0; i < 101; i++) {
        ast = {type: 'brace', nodes: [ast]};
      }
      ast = {type: 'root', nodes: [ast]};
      assert.throws(function() {
        braces.compile(ast);
      }, /exceeds max depth/);
    });

    it('should reject cyclic ASTs instead of recursing forever', function() {
      var brace = {type: 'brace', nodes: []};
      brace.nodes.push(brace);
      var ast = {type: 'root', nodes: [brace]};
      assert.throws(function() {
        braces.compile(ast);
      }, /exceeds max depth/);
    });

    it('should support a lower maximum depth for ASTs', function() {
      assert.throws(function() {
        braces.compile(braces.parse('{{a,b},c}'), {maxDepth: 1});
      }, /exceeds max depth/);
      var res = braces.compile(braces.parse('{{a,b},c}'), {maxDepth: 2});
      assert.deepEqual(res.output, braces.compile('{{a,b},c}').output);
    });

    it('should support ASTs nested up to the maximum depth', function() {
      var ast = braces.parse(repeat('{', 100) + 'a,b' + repeat('}', 100));
      assert.doesNotThrow(function() {
        braces.compile(ast);
      });
    });
  });
});
