var assert = require('assert');
var Pack = require('../../../');

describe('Queryable ::', function () {
  describe('Compile Statement', function () {
    it('should generate a SQL Statement from a WLQL query', async function () {
      let report = await Pack.compileStatement({
        statement: {
          select: ['title', 'author', 'year'],
          from: 'books'
        }
      });

      assert.equal(report.nativeQuery, 'select [title], [author], [year] from [books]');
    });

    // TODO: Add lots of checking to the statement compiler
    it('should return the malformed exit for bad WLQL', async function () {
      try {
        await Pack.compileStatement({
          statement: {
            foo: 'bar',
            from: 'books'
          }
        });
      } catch (err) {
        assert(err);
      }
    });
  });
});
