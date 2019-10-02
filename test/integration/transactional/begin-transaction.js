var assert = require('assert');
var _ = require('@sailshq/lodash');
var Pack = require('../../../');
var {config} = require('../../config');

describe('Transactional ::', function () {
  describe('Begin Transaction', function () {
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

    // Afterwards close the transaction and release the connection
    after(async function () {
      await Pack.rollbackTransaction({
        connection: connection
      });

      await Pack.releaseConnection({
        connection: connection
      });

      await Pack.destroyManager({
        manager: manager
      });
    });

    it('should send a query that starts a transaction on the current connection', async function testQuery() {
      // Check if a transaction is currently open
      let report = await Pack.sendNativeQuery({
        connection: connection,
        nativeQuery: 'SELECT @@trancount;'
      });

      var startingTxId = _.first(report.result.rows)[""];

      // Open a Transaction using the machine
      await Pack.beginTransaction({
        connection: connection
      });

      // Get the updated transaction id
      report = await Pack.sendNativeQuery({
        connection: connection,
        nativeQuery: 'SELECT @@trancount;'
      });

      var currentTxId = _.first(report.result.rows)[""];

      // Get another transaction id
      report = await Pack.sendNativeQuery({
        connection: connection,
        nativeQuery: 'SELECT @@trancount;'
      });

      var afterTxId = _.first(report.result.rows)[""];

      // The first two transaction id's should be different.
      // This should show that a transaction was NOT in progress.
      assert.notEqual(startingTxId, currentTxId);

      // The last two transaction id's should be the same. This should
      // show that a transaction was opened.
      assert.equal(currentTxId, afterTxId);
    });
  });
});
