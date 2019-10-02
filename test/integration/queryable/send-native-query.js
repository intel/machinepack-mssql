var assert = require('assert');
var _ = require('@sailshq/lodash');
var Pack = require('../../../');
var {config} = require('../../config');

describe('Queryable ::', function () {
  describe('Send Native Query', function () {
    var manager;
    var connection;

    // Create a manager and connection
    before(async function () {

      let report = await Pack.createManager({
        meta: config
      });

      // Store the manager
      manager = report.manager;

      report = await Pack.getConnection({
        manager: manager
      });

      // Store the connection
      connection = report.connection;
    });

    // Afterwards release the connection
    after(async function () {
      await Pack.releaseConnection({
        connection: connection
      });

      await Pack.destroyManager({
        manager: manager
      });
    });

    it('should run a native query and return the reports', async function () {
      let report = await Pack.sendNativeQuery({
        connection: connection,
        nativeQuery: 'SELECT 1, \'one\', 2, \'two\';'
      });

      assert(_.isArray(report.result.rows));
      assert(report.result.rows.length);

    });
  });
});
