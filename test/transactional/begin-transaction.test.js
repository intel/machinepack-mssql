var Pack = require('../../');

describe('Transactional ::', function () {
  describe.skip('Begin Transaction', function () {
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

              return done();
            });
        });
    });

    // Afterwards close the transaction and release the connection
    after(function (done) {
      Pack.sendNativeQuery({
        connection: connection,
        nativeQuery: 'ROLLBACK;'
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

    // TODO: Find a way to get a transaction id in mssql??
  });
});
