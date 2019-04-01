var assert = require('assert');
var Pack = require('../../');

var config = require('../config');

describe('Connectable ::', function () {
  describe('Create Manager', function () {
    it('should work without a protocol in the connection string', function (done) {
      Pack.createManager({
        connectionString: config.connectionString.match(/mssql:\/\/(.*)/)[1]
      })
        .exec(function (err) {
          if (err) {
            return done(err);
          }
          return done();
        });
    });

    it('should successfully return a Pool', function (done) {
      Pack.createManager({
        connectionString: config.connectionString,
      })
        .exec(function (err, report) {
          if (err) {
            return done(err);
          }

          // Assert that the manager has a pool object
          assert(report.manager.pool);

          // Assert that the manager has a connect function
          assert(report.manager.pool.connect);

          return done();
        });
    });
  });
});
