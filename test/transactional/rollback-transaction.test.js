var assert = require('assert');
var Pack = require('../../');

describe('Transactional ::', function () {
  describe('Rollback Transaction', function () {
    var manager;
    var connection;

    var config = require('../config');

    // Create a manager, a connection, and a table
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
              Pack.sendNativeQuery({
                connection: connection,
                nativeQuery: 'IF OBJECT_ID(N\'dbo.people\', N\'U\') IS NULL BEGIN CREATE TABLE dbo.people(id int not null identity(1,1) primary key, name varchar(255)); END;'
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

    // Afterwards destroy the table and release the connection
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

    // To Test:
    // * Open a transaction on connection and insert a record into the DB
    // * Run a query on connection and make sure the record exist
    // * Rollback the transaction
    // * Run the select query again and the record should not exist
    it('should perform a transaction and make sure the results are rolled back correctly', function (done) {
      // Start a transaction
      Pack.beginTransaction({
        connection: connection
      })
        .exec(function (err) {
          if (err) {
            return done(err);
          }

          // Insert a record using the transaction
          Pack.sendNativeQuery({
            connection: connection,
            nativeQuery: 'INSERT INTO people (name) VALUES (\'hugo\');'
          })
            .exec(function (err) {
              if (err) {
                return done(err);
              }

              // Query the table and ensure the record does exist
              Pack.sendNativeQuery({
                connection: connection,
                nativeQuery: 'SELECT * FROM people;'
              })
                .exec(function (err, report) {
                  if (err) {
                    return done(err);
                  }

                  // Ensure 1 result were returned
                  assert.equal(report.result.recordsets[0].length, 1);

                  // Rollback the transaction
                  Pack.rollbackTransaction({
                    connection: connection
                  })
                    .exec(function (err) {
                      if (err) {
                        return done(err);
                      }

                      // Query the table using and ensure the record doesn't exist
                      Pack.sendNativeQuery({
                        connection: connection,
                        nativeQuery: 'SELECT * FROM people;'
                      })
                        .exec(function (err, report) {
                          if (err) {
                            return done(err);
                          }

                          // Ensure no results were returned
                          assert.equal(report.result.recordsets[0].length, 0);

                          return done();
                        });
                    });
                });
            });
        });
    });
  });
});
