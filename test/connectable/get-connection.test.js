var assert = require('assert');
var Pack = require('../../');

var config = require('../config');


describe('Connectable ::', function () {
  describe('Get Connection', function () {
    var manager;

    // Create a manager
    before(function (done) {
      // Needed to dynamically get the host using the docker container
      // var host = process.env.MSSQL_PORT_3306_TCP_ADDR || 'localhost';

      Pack.createManager({
        connectionString: config.connectionString,
      })
        .exec(function (err, report) {
          if (err) {
            return done(err);
          }

          manager = report.manager;
          return done();
        });
    });

    it('should successfully return a connection instance', async function () {
      const report = await Pack.getConnection({ manager: manager });

      // Assert that the report has a client object
      assert(report.connection);

      // Assert that the connection has a close function
      assert(report.connection.close);

    });

    it('should not return the same connection on subsequent calls', async function () {
      const report1 = await Pack.getConnection({ manager: manager });
      const report2 = await Pack.getConnection({ manager: manager });

      assert.notStrictEqual(report1.connection, report2.connection);
    });

  });
});
