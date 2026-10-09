'use strict';

require('mocha');
var assert = require('assert');
var braces = require('..');

function equal(pattern, expected, options) {
  assert.deepEqual(braces(pattern, options), expected);
}

equal.expand = function(pattern, expected, options) {
  var actual = braces.expand(pattern, options).sort();
  assert.deepEqual(actual.filter(Boolean), expected.sort(), pattern);
};

describe('braces', function() {
  it('should return an array', function() {
    assert(Array.isArray(braces('{a,b}')));
  });

  it('should return an optimized string by default', function() {
    equal('a/{b,c}/d', ['a/(b|c)/d']);
  });

  it('should return an expanded array if defined on options', function() {
    equal('a/{b,c}/d', ['a/b/d', 'a/c/d'], {expand: true});
  });

  it('should optimize an array of patterns', function() {
    equal(['a/{b,c}/d', 'x/{foo,bar}/z'], ['a/(b|c)/d', 'x/(foo|bar)/z']);
  });

  it('should expand an array of patterns', function() {
    var actual = braces(['a/{b,c}/d', 'a/{b,c}/d']);
    assert.deepEqual(actual, ['a/(b|c)/d', 'a/(b|c)/d']);
  });

  it('should not uniquify by default', function() {
    var actual = braces(['a/{b,c}/d', 'a/{b,c}/d']);
    assert.deepEqual(actual, ['a/(b|c)/d', 'a/(b|c)/d']);
  });

  it('should uniquify when `options.nodupes` is true', function() {
    var actual = braces(['a/{b,c}/d', 'a/{b,c}/d'], {nodupes: true});
    assert.deepEqual(actual, ['a/(b|c)/d']);
  });

  it('should expand ranges', function() {
    equal('a{1..5}b', ['a1b', 'a2b', 'a3b', 'a4b', 'a5b'], {expand: true});
  });

  it('should expand ranges that are nested in a set', function() {
    equal('a{b,c,{1..5}}e', ['abe', 'ace', 'a1e', 'a2e', 'a3e', 'a4e', 'a5e'], {expand: true});
  });

  it('should not expand ranges when they are just characters in a set', function() {
    equal('a{b,c,1..5}e', ['abe', 'ace', 'a1..5e'], {expand: true});
    equal('a{/../}e', ['a/e'], {expand: true});
    equal('a{/../,z}e', ['a/../e', 'aze'], {expand: true});
    equal('a{b,c/*/../d}e', ['abe', 'ac/*/../de'], {expand: true});
    equal('a{b,b,c/../b}d', ['abd', 'abd', 'ac/../bd'], {expand: true});
  });

  it('should support expanded nested empty sets', function() {
    equal.expand('{\`foo,bar\`}', ['{foo,bar}']);
    equal.expand('{\\`foo,bar\\`}', ['`foo', 'bar`']);
    equal.expand('{`foo\,bar`}', ['{foo,bar}']);
    equal.expand('{`foo\\,bar`}', ['{`foo\\,bar`}']);
    equal.expand('{a,\\\\{a,b}c}', ['a', '\\\\ac', '\\\\bc']);
    equal.expand('{a,\\{a,b}c}', ['ac}', '{ac}', 'bc}']);
    equal.expand('{,eno,thro,ro}ugh', ['ugh', 'enough', 'through', 'rough']);
    equal.expand('{,{,eno,thro,ro}ugh}{,out}', ['out', 'ugh', 'ughout', 'enough', 'enoughout', 'through', 'throughout', 'rough', 'roughout']);
    equal.expand('{{,eno,thro,ro}ugh,}{,out}', ['ugh', 'ughout', 'enough', 'enoughout', 'through', 'throughout', 'rough', 'roughout', 'out']);
    equal.expand('{,{,a,b}z}{,c}', ['c', 'z', 'zc', 'az', 'azc', 'bz', 'bzc']);
    equal.expand('{,{,a,b}z}{c,}', ['c', 'zc', 'z', 'azc', 'az', 'bzc', 'bz']);
    equal.expand('{,{,a,b}z}{,c,}', ['c', 'z', 'zc', 'z', 'az', 'azc', 'az', 'bz', 'bzc', 'bz']);
    equal.expand('{,{,a,b}z}{c,d}', ['c', 'd', 'zc', 'zd', 'azc', 'azd', 'bzc', 'bzd']);
    equal.expand('{{,a,b}z,}{,c}', ['z', 'zc', 'az', 'azc', 'bz', 'bzc', 'c']);
    equal.expand('{,a{,b}z,}{,c}', ['c', 'az', 'azc', 'abz', 'abzc', 'c']);
    equal.expand('{,a{,b},}{,c}', ['c', 'a', 'ac', 'ab', 'abc', 'c']);
    equal.expand('{,a{,b}}{,c}', ['c', 'a', 'ac', 'ab', 'abc']);
    equal.expand('{,b}{,d}', ['d', 'b', 'bd']);
    equal.expand('{a,b}{,d}', ['a', 'ad', 'b', 'bd']);
    equal.expand('{,a}{z,c}', ['z', 'c', 'az', 'ac']);
    equal.expand('{,{a,}}{z,c}', ['z', 'c', 'z', 'c', 'az', 'ac']);
    equal.expand('{,{,a}}{z,c}', ['z', 'c', 'z', 'c', 'az', 'ac']);
    equal.expand('{,{,a},}{z,c}', ['z', 'c', 'z', 'c', 'az', 'ac', 'z', 'c']);
    equal.expand('{{,,a}}{z,c}', [ '{}z', '{}c', '{}z', '{}c', '{a}z', '{a}c' ]);
    equal.expand('{{,a},}{z,c}', ['z', 'c', 'az', 'ac', 'z', 'c']);
    equal.expand('{,,a}{z,c}', ['z', 'c', 'z', 'c', 'az', 'ac']);
    equal.expand('{,{,}}{z,c}', ['z', 'c', 'z', 'c', 'z', 'c']);
    equal.expand('{,{a,b}}{,c}', ['c', 'a', 'ac', 'b', 'bc']);
    equal.expand('{,{a,}}{,c}', ['c', 'a', 'ac', 'c']);
    equal.expand('{,{,b}}{,c}', ['c', 'c', 'b', 'bc']);
    equal.expand('{,{,}}{,c}', ['c', 'c', 'c']);
    equal.expand('{,a}{,c}', ['c', 'a', 'ac']);
    equal.expand('{,{,a}b}', ['b', 'ab']);
    equal.expand('{,b}', ['b']);
    equal.expand('{,b{,a}}', ['b', 'ba']);
    equal.expand('{b,{,a}}', ['b', 'a']);
    equal.expand('{,b}{,d}', ['d', 'b', 'bd']);
    equal.expand('{a,b}{,d}', ['a', 'ad', 'b', 'bd']);
  });

  it('should support optimized nested empty sets', function() {
    equal('{\`foo,bar\`}', [ '{foo,bar}' ]);
    equal('{\\`foo,bar\\`}', [ '(`foo|bar`)' ]);
    equal('{`foo\,bar`}', [ '{foo,bar}' ]);
    equal('{`foo\\,bar`}', [ '(`foo\\,bar`)' ]);
    equal('{a,\\\\{a,b}c}', [ '(a|\\\\(a|b)c)' ]);
    equal('{a,\\{a,b}c}', [ '(a|{a|b)c}' ]);
    equal('a/{\\{b,c,d},z}/e', [ 'a/({b|c|d),z}/e' ]);
    equal('{,eno,thro,ro}ugh', [ '(|eno|thro|ro)ugh' ]);
    equal('{,{,eno,thro,ro}ugh}{,out}', [ '((|eno|thro|ro)ugh|)(|out)' ]);
    equal('{{,eno,thro,ro}ugh,}{,out}', [ '((|eno|thro|ro)ugh|)(|out)' ]);
    equal('{,{,a,b}z}{,c}', [ '((|a|b)z|)(|c)' ]);
    equal('{,{,a,b}z}{c,}', [ '((|a|b)z|)(c|)' ]);
    equal('{,{,a,b}z}{,c,}', [ '((|a|b)z|)(|c|)' ]);
    equal('{,{,a,b}z}{c,d}', [ '((|a|b)z|)(c|d)' ]);
    equal('{{,a,b}z,}{,c}', [ '((|a|b)z|)(|c)' ]);
    equal('{,a{,b}z,}{,c}', [ '(|a(|b)z|)(|c)' ]);
    equal('{,a{,b},}{,c}', [ '(|a(|b)|)(|c)' ]);
    equal('{,a{,b}}{,c}', [ '(|a(|b))(|c)' ]);
    equal('{,b}{,d}', [ '(|b)(|d)' ]);
    equal('{a,b}{,d}', [ '(a|b)(|d)' ]);
    equal('{,a}{z,c}', [ '(|a)(z|c)' ]);
    equal('{,{a,}}{z,c}', [ '((a|)|)(z|c)' ]);
    equal('{,{,a}}{z,c}', [ '((|a)|)(z|c)' ]);
    equal('{,{,a},}{z,c}', [ '((|a)||)(z|c)' ]);
    equal('{{,,a}}{z,c}', [ '((||a))(z|c)' ]);
    equal('{{,a},}{z,c}', [ '((|a)|)(z|c)' ]);
    equal('{,,a}{z,c}', [ '(||a)(z|c)' ]);
    equal('{,{,}}{z,c}', [ '(z|c)' ]);
    equal('{,{a,b}}{,c}', [ '((a|b)|)(|c)' ]);
    equal('{,{a,}}{,c}', [ '((a|)|)(|c)' ]);
    equal('{,{,b}}{,c}', [ '((|b)|)(|c)' ]);
    equal('{,{,}}{,c}', [ '(|c)' ]);
    equal('{,a}{,c}', [ '(|a)(|c)' ]);
    equal('{,{,a}b}', [ '((|a)b|)' ]);
    equal('{,b}', [ '(|b)' ]);
    equal('{,b{,a}}', [ '(|b(|a))' ]);
    equal('{b,{,a}}', [ '(b|(|a))' ]);
    equal('{,b}{,d}', [ '(|b)(|d)' ]);
    equal('{a,b}{,d}', [ '(a|b)(|d)' ]);
  });

  describe('nesting depth', function() {
    function repeat(str, n) {
      return new Array(n + 1).join(str);
    }

    function nested(n) {
      return repeat('{', n) + 'a,b' + repeat('}', n);
    }

    it('should reject deeply nested braces instead of overflowing the stack', function() {
      [nested(101), nested(1000)].forEach(function(input) {
        assert.throws(function() {
          braces(input);
        }, /exceeds max depth/);
        assert.throws(function() {
          braces(input, {expand: true});
        }, /exceeds max depth/);
        assert.throws(function() {
          braces([input]);
        }, /exceeds max depth/);
        assert.throws(function() {
          braces.expand(input);
        }, /exceeds max depth/);
        assert.throws(function() {
          braces.optimize(input);
        }, /exceeds max depth/);
        assert.throws(function() {
          braces.create(input);
        }, /exceeds max depth/);
        assert.throws(function() {
          braces.makeRe(input);
        }, /exceeds max depth/);
        assert.throws(function() {
          braces.compile(input);
        }, /exceeds max depth/);
      });
    });

    it('should reject deeply nested braces when options.maxLength is raised', function() {
      var input = nested(10000);
      var opts = {maxLength: input.length + 1};
      assert.throws(function() {
        braces(input, opts);
      }, /exceeds max depth/);
      assert.throws(function() {
        braces.expand(input, opts);
      }, /exceeds max depth/);
      assert.throws(function() {
        braces.makeRe(input, opts);
      }, /exceeds max depth/);
    });

    it('should reject deeply nested unclosed braces', function() {
      var input = repeat('{', 1000) + 'a,b';
      assert.throws(function() {
        braces(input);
      }, /exceeds max depth/);
      assert.throws(function() {
        braces.expand(input);
      }, /exceeds max depth/);
    });

    it('should not cache patterns that exceed the maximum depth', function() {
      var input = nested(101);
      assert.throws(function() {
        braces(input);
      }, /exceeds max depth/);
      assert.throws(function() {
        braces(input);
      }, /exceeds max depth/);
    });

    it('should support nesting up to the maximum depth', function() {
      var input = nested(100);
      assert.doesNotThrow(function() {
        braces(input);
      });
      assert.doesNotThrow(function() {
        braces(input, {expand: true});
      });
      assert.doesNotThrow(function() {
        braces.makeRe(input);
      });
    });

    it('should support a lower maximum depth', function() {
      assert.throws(function() {
        braces('{{a,b},c}', {maxDepth: 1});
      }, /exceeds max depth/);
      assert.throws(function() {
        braces('{{a,b},c}', {maxDepth: 1, expand: true});
      }, /exceeds max depth/);
      assert.deepEqual(braces('{{a,b},c}', {maxDepth: 2}), braces('{{a,b},c}'));
      assert.deepEqual(braces.expand('{{a,b},c}', {maxDepth: 2}), braces.expand('{{a,b},c}'));
    });

    it('should not allow options.maxDepth to raise the maximum depth', function() {
      assert.throws(function() {
        braces(nested(101), {maxDepth: 1000});
      }, /exceeds max depth/);
    });

    it('should not limit parentheses, which do not create nested nodes', function() {
      var input = repeat('(', 1000) + repeat(')', 1000);
      assert.deepEqual(braces(input), [input]);
      assert.deepEqual(braces(input, {expand: true}), [input]);
    });
  });
});
