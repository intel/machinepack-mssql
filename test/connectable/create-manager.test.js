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

    it('should fail sync execution', function (done) {
      try {
        Pack.createManager({
          connectionString: config.connectionString.match(/mssql:\/\/(.*)/)[1]
        }).execSync();
      } catch(unused) {
        return done();
      }
      return done(new Error('Sync execution of createManager should fail'));
    });

    it('should fail if connect fails', function (done) {
      Pack.createManager({
        connectionString: 'mssql://notauser:notapassword@localhost:1433/sails-test'
      }).exec(function (err) {
        if (err) {
          return done();
        }
        return done(new Error('No error reported'));
      });
    });
  });
});
