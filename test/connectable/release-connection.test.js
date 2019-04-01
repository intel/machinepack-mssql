var assert = require('assert');
var Pack = require('../../');

var config = require('../config');

describe('Connectable ::', function () {
  describe('Release Connection', function () {
    var manager;
    var connection;

    // Create a manager and connection
    before(function (done) {

      Pack.createManager({
        connectionString: config.connectionString,
      })
        .exec(function (err, report) {
          if (err) {
            return done(err);
          }

          manager = report.manager;

          Pack.getConnection({
            manager: manager
          })
            .exec(function (err, report) {
              if (err) {
                return done(err);
              }

              connection = report.connection;
              return done();
            });
        });
    });

    // Not sure how to do this with MSSQL. It doesn't appear to lock connection when pool is connected...
    it.skip('should successfully release a connection', function (done) {
      // Grab the number of free connections before releasing the current one

      var freeConnectionsPreRelease = manager.pool.pool.spareResourceCapacity;

      // Release the connection
      Pack.releaseConnection({
        connection: connection
      })
        .exec(function (err) {
          if (err) {
            return done(err);
          }

          // If the connection was successfully released the _allConnections and the
          // _freeConnections should be equal.
          // https://github.com/mssqljs/mssql/blob/master/lib/Pool.js
          var poolSize = manager.pool.pool.max;
          var freeConnectionsPostRelease = manager.pool.pool.spareResourceCapacity;

          // Ensure we end up with different counts after releasing the connection
          assert.notEqual(freeConnectionsPostRelease, freeConnectionsPreRelease);

          // Ensure that all the available connections are free
          assert.equal(poolSize, freeConnectionsPostRelease);

          return done();
        });
    });
  });
});
