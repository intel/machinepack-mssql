var Pack = require('../../../');
var {config} = require('../../config');

describe('Connectable ::', function () {
  describe('Release Connection', function () {
    var manager;
    var connection;

    // Create a manager and connection
    before(async function () {
      let managerReport = await Pack.createManager({
        meta: config
      });

      manager = managerReport.manager;

      let report = await Pack.getConnection({
        manager: manager
      });

      connection = report.connection;
    });

    after(async function () {
      await Pack.destroyManager({
        manager: manager
      });
    });

    it('should successfully release a connection', async function () {
      await Pack.releaseConnection({
        connection: connection
      });

      // It's a little bit like inception here digging into manager.manager.pool.pool
      // var poolSize = manager.pool.pool.getPoolSize();
      // var poolSize = manager.pool.pool.size;
      // var availableObjects = manager.pool.pool.availableObjectsCount();
      //
      // assert.equal(poolSize, availableObjects);
    });
  });
})
;
