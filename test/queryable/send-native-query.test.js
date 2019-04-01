var assert = require('assert');
var _ = require('@sailshq/lodash');
var Pack = require('../../');

describe('Queryable ::', function () {
  describe('Send Native Query', function () {
    var manager;
    var connection;

    var config = require('../config');

    // Create a manager and connection
    before(async function () {

      const managerReport = await Pack.createManager({
        connectionString: config.connectionString,
      });

      // Store the manager
      manager = managerReport.manager;

      const connectionReport = await Pack.getConnection({
        manager: manager
      });

      // Store the connection
      connection = connectionReport.connection;

      // Create a table to use for testing
      // Uses sendNativeQuery but doesn't get rows or anything.
      // TODO: figure out a query that can run with the given permissions
      // that doesn't need an additional table
      await Pack.sendNativeQuery({
        connection: connection,
        nativeQuery: 'IF OBJECT_ID(N\'dbo.people\', N\'U\') IS NULL BEGIN CREATE TABLE dbo.people(name varchar(255)); END;'
      });
      await Pack.sendNativeQuery({
        connection: connection,
        nativeQuery: `
        CREATE PROCEDURE [dbo].[addem] @first int = -1, @second int = -1, @sum int output
          AS
        BEGIN
          SET NOCOUNT ON;
          select @sum = @first + @second
          select @sum * @sum
        END
        `
      });
    });

    // Afterwards release the connection
    after(async function () {
      await Pack.sendNativeQuery({
        connection: connection,
        nativeQuery: 'DROP TABLE people;'
      });
      await Pack.sendNativeQuery({
        connection: connection,
        nativeQuery: `drop PROCEDURE [dbo].[addem]`
      });

      await Pack.releaseConnection({
        connection: connection
      });

    });

    it('should run a native query and return the reports', function (done) {
      Pack.sendNativeQuery({
        connection: connection,
        nativeQuery: 'select * from people;'
      })
        .exec(function (err, report) {
          if (err) {
            return done(err);
          }

          assert(_.isArray(report.result.recordsets[0]));
          // assert(_.isArray(report.result.rows));

          return done();
        });
    });
    it('should run a stored proc', function (done) {
      Pack.sendNativeQuery({
        connection: connection,
        nativeQuery: 'addem',
        valuesToEscape: {
          input: [
            // { name: 'first', value: 3, type: 'nvarchar' },
            // { name: 'second', value: 4, type: 'nvarchar' }
            { name: 'first', value: 3 },
            { name: 'second', value: 4 }
          ],
          output: [
            // { name: 'sum', value: 14, type: 'Int' }
            { name: 'sum', type: 'Int' }
          ]
        },
      })
        .exec(function (err, report) {
          if (err) {
            return done(err);
          }
          assert.equal(report.result.output.sum, 7);

          assert(_.isArray(report.result.recordsets[0]));

          return done();
        });
    });
  });
});
