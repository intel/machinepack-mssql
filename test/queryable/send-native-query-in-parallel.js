var assert = require('assert');
var _ = require('@sailshq/lodash');
var Pack = require('../../');
var moment = require('moment');
var Promise = require('bluebird');

describe('Queryable ::', function () {
  describe('Send Native Query in Parallel', function () {
    var manager;
    var connection;

    var config = require('../config');

    // Create a manager and connection
    before(function (done) {

      Pack.createManager({
        connectionString: config.connectionString,
      })
        .exec(function (err, report) {
          if (err) {
            return done(err);
          }

          // Store the manager
          manager = report.manager;

          Pack.getConnection({
            manager: manager
          })
            .exec(function (err, report) {
              if (err) {
                return done(err);
              }

              // Store the connection
              connection = report.connection;

              // Create a table to use for testing
              // Uses sendNativeQuery but doesn't get rows or anything.
              // TODO: figure out a query that can run with the given permissions
              // that doesn't need an additional table
              Pack.sendNativeQuery({
                connection: connection,
                nativeQuery: 'IF OBJECT_ID(N\'dbo.people\', N\'U\') IS NULL BEGIN CREATE TABLE dbo.people(name varchar(255)); END;'
              })
                .exec(function (err) {
                  if (err) {
                    return done(err);
                  }

                  return done();
                });
            });
        });
    });

    // Afterwards release the connection
    after(function (done) {
      Pack.sendNativeQuery({
        connection: connection,
        nativeQuery: 'DROP TABLE people;'
      })
        .exec(function (err) {
          if (err) {
            return done(err);
          }

          Pack.releaseConnection({
            connection: connection
          }).exec(done);
        });
    });

    it.skip('should run multiple queries simultaneously', async function () {
      var start = moment();
      var batches = _.times(11, Number);

      var report = await Promise.map(batches, function () {
        return Pack.sendNativeQuery({
          connection: connection,
          nativeQuery: 'waitfor delay \'00:00:03\' select * from people;'
        });
      }
      );

      assert(_.isArray(report[0].result.recordsets[0]));
      var stop = moment();
      const timeExpired = stop - start;
      assert(timeExpired > 6000, 'Should wait at least 6 seconds');
      assert(timeExpired < 7000, 'Should finish soon after 6 seconds');
    });
  });
});
