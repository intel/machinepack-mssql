var assert = require('assert');
var Pack = require('../../../');
var {config} = require('../../config');
const util = require('../../../machines/private/util');

describe('Connectable ::', function () {
  describe('Get Connection', function () {
    var manager;

    // Create a manager
    before(async function () {
      let report = await Pack.createManager({
        meta: config
      });

      manager = report.manager;
    });

    after(async function() {
      await Pack.destroyManager({
        manager: manager
      });
    });

    it('should successfully return a Mssql Client instance', async function () {
      let report = await Pack.getConnection({
        manager: manager
      });

      // Assert that the report has a client object
      assert(report.connection);
      assert(report.connection.connected);
      // Assert that the connection has a releaseConnection function
      assert(report.connection instanceof util.WrappedConnection);
      assert(report.connection.release);
      assert(report.connection.releaseConnection);

      await Pack.releaseConnection({
        connection: report.connection
      });
    });
  });
});
