var assert = require('assert');
var Pack = require('../../');

describe('Transactional ::', function () {
  describe('Commit Transaction', function () {
    var manager;
    var connectionA;
    var connectionB;

    var config = require('../config');

    // Create a manager, two connections, and a table
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
              connectionA = report.connection;

              Pack.getConnection({
                manager: manager
              })
                .exec(async function (err, report) {
                  if (err) {
                    return done(err);
                  }

                  // Store the connection
                  connectionB = report.connection;

                  // Create a table to use for testing
                  await Pack.sendNativeQuery({
                    connection: connectionA,
                    nativeQuery: 'IF OBJECT_ID(N\'dbo.people\', N\'U\') IS NULL BEGIN CREATE TABLE dbo.people(id int not null identity(1,1) primary key, name varchar(255)); END;'
                  });
                  await Pack.sendNativeQuery({
                    connection: connectionA,
                    nativeQuery: 'IF OBJECT_ID(N\'dbo.otherpeople\', N\'U\') IS NULL BEGIN CREATE TABLE dbo.otherpeople(id int not null identity(1,1) primary key, name varchar(255)); END;'
                  });
                  done();
                });
            });
        });
    });

    // Afterwards destroy the table and release the connections
    after(function (done) {
      Pack.sendNativeQuery({
        connection: connectionA,
        nativeQuery: 'DROP TABLE people; drop table otherpeople;'
      })
        .exec(function (err) {
          if (err) {
            return done(err);
          }

          Pack.releaseConnection({
            connection: connectionA
          })
            .exec(function (err) {
              if (err) {
                return done(err);
              }

              Pack.releaseConnection({
                connection: connectionB
              }).exec(done);
            });
        });
    });

    // To Test:
    // * Open a transaction on connectionA and insert a record into the DB
    // * Run a query on connectionB and make sure the record doesn't exist
    // * Commit the transaction
    // * Run the select query again and the record should exist
    it.only('should perform a transaction and make sure the results are commited correctly', function (done) {
      // Start a transaction on connection A
      Pack.beginTransaction({
        connection: connectionA,
        meta: {
          isolationLevel: 'READ_UNCOMMITTED',
        }
      })
        .exec(function (err) {
          if (err) {
            return done(err);
          }

          // Insert a record using the transaction
          Pack.sendNativeQuery({
            connection: connectionA,
            nativeQuery: 'INSERT INTO people (name) VALUES (\'hugo\');'
          })
            .exec(function (err) {
              if (err) {
                return done(err);
              }

              // Query the table using connection B and ensure the record doesn't exist
              Pack.sendNativeQuery({
                connection: connectionB,
                nativeQuery: 'SELECT * FROM otherpeople;'
              })
                .exec(function (err, report) {
                  if (err) {
                    return done(err);
                  }

                  // Ensure no results were returned
                  assert.equal(report.result.recordsets[0].length, 0);

                  // Commit the transaction
                  Pack.commitTransaction({
                    connection: connectionA
                  })
                    .exec(function (err) {
                      if (err) {
                        return done(err);
                      }

                      // Query the table using connection B and ensure the record does exist
                      Pack.sendNativeQuery({
                        connection: connectionB,
                        nativeQuery: 'SELECT * FROM people;'
                      })
                        .exec(function (err, report) {
                          if (err) {
                            return done(err);
                          }

                          // Ensure 1 result was returned
                          assert.equal(report.result.recordsets.length, 1);

                          return done();
                        });
                    });
                });
            });
        });
    });
  });
});
