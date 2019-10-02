var assert = require('assert');
var mssql = require('mssql');
var util = require('util');
var Pack = require('../../../');
var {config} = require('../../config');

describe('Connectable ::', function () {
  describe('Create Manager', function () {

    it('should work without a protocol in the connection string', async function () {
      var connectString = util.format("%s:%s@%s:%s/%s", config.user, config.password, config.server, config.port, config.database);
      let report = await Pack.createManager({
        connectionString: connectString
      });

      assert(report);
      assert(report.manager);

      await Pack.destroyManager({
        manager: report.manager
      });
    });

    it('should successfully return a MsSql Pool instance (using mssql:// protocol)', async function () {
      let report = await Pack.createManager({
        meta: config
      });

      // Assert that the manager has a pool object
      assert(report.manager.pool);

      // Assert that a Mssql Pool is returned
      assert(report.manager.pool instanceof mssql.ConnectionPool);

      // Assert that the manager has a connect function
      assert(report.manager.pool.connect);

      await Pack.destroyManager({
        manager: report.manager
      });
    });

    it('should successfully return a Mssql Pool instance', async function () {
      let report = await Pack.createManager({
        meta: config
      });

      // Assert that the manager has a pool object
      assert(report.manager.pool);

      // Assert that a Mssql Pool is returned
      assert(report.manager.pool instanceof mssql.ConnectionPool);

      // Assert that the manager has a connect function
      assert(report.manager.pool.connect);

      await Pack.destroyManager({
        manager: report.manager
      });
    });

    it('should work a config meta input', async function () {
      const connectString = util.format("%s:%s@%s:%s/%s", config.user, config.password, config.server, config.port, config.database);
      let report = await Pack.createManager({
        connectionString: connectString,
        meta: {
          pool: {
            max: 25
          }
        }
      });
      assert.ok(report.manager);
      assert.equal(25, report.manager.pool.pool._config.max);

      await Pack.destroyManager({
        manager: report.manager
      });
    });
  });
});
