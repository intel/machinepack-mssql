var assert = require('assert');
var _ = require('@sailshq/lodash');
var Pack = require('../../');

var config = require('../config');

describe('Queryable ::', function () {
  describe('Parse Native Query Result', function () {
    var manager;
    var connection;

    // Create a manager and connection
    before(function (done) {
      // Needed to dynamically get the host using the docker container

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

    // Afterwards destroy the test table and release the connection
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

    it('should normalize SELECT query results from a native query', function (done) {
      Pack.sendNativeQuery({
        connection: connection,
        nativeQuery: 'SELECT * from people;'
      })
        .exec(function (err, report) {
          if (err) {
            return done(err);
          }

          var result = report.result;

          Pack.parseNativeQueryResult({
            queryType: 'select',
            nativeQueryResult: result
          })
            .exec(function (err, report) {
              if (err) {
                return done(err);
              }

              assert(report.result);
              assert(_.isArray(report.result));
              assert.equal(report.result.length, 0);

              return done();
            });
        });
    });

    it('should normalize INSERT query results from a native query', function (done) {
      Pack.sendNativeQuery({
        connection: connection,
        nativeQuery: 'INSERT INTO people (name) output inserted.* VALUES (\'hugo\'); SELECT scope_identity();'
      })
        .exec(function (err, report) {
          if (err) {
            return done(err);
          }

          var result = report.result;

          Pack.parseNativeQueryResult({
            queryType: 'insert',
            nativeQueryResult: result
          })
            .exec(function (err, report) {
              if (err) {
                return done(err);
              }

              assert(report.result);
              assert(report.result.insertedId);

              // We don't know what the ID will be so just check it's a number
              assert(_.isNumber(report.result.insertedId));

              return done();
            });
        });
    });

    it('should normalize UPDATE query results from a native query', function (done) {
      Pack.sendNativeQuery({
        connection: connection,
        nativeQuery: 'INSERT INTO people (name) VALUES (\'hugo\'); SELECT scope_identity();'
      })
        .exec(function (err, report) {
          if (err) {
            return done(err);
          }
          var insertId = Object.values(report.result.recordsets[0][0])[0];
          Pack.sendNativeQuery({
            connection: connection,
            nativeQuery: 'UPDATE people SET name = \'George\' where id = ' + insertId + ';'
          })
            .exec(function (err, report) {
              if (err) {
                return done(err);
              }

              var result = report.result;

              Pack.parseNativeQueryResult({
                queryType: 'update',
                nativeQueryResult: result
              })
                .exec(function (err, report) {
                  if (err) {
                    return done(err);
                  }

                  assert(report.result);
                  assert(report.result.numRecordsUpdated);
                  assert.equal(report.result.numRecordsUpdated, 1);

                  return done();
                });
            });
        });
    });

    it('should normalize DELETE query results from a native query', function (done) {
      Pack.sendNativeQuery({
        connection: connection,
        nativeQuery: 'INSERT INTO people (name) VALUES (\'Sally\');'
      })
        .exec(function (err, report) {
          if (err) {
            return done(err);
          }

          // Ensure that the record inserted ok
          assert.equal(report.result.rowsAffected[0], 1);

          Pack.sendNativeQuery({
            connection: connection,
            nativeQuery: 'DELETE FROM people WHERE name = \'Sally\';'
          })
            .exec(function (err, report) {
              if (err) {
                return done(err);
              }

              var result = report.result;

              Pack.parseNativeQueryResult({
                queryType: 'delete',
                nativeQueryResult: result
              })
                .exec(function (err, report) {
                  if (err) {
                    return done(err);
                  }

                  assert(report.result);
                  assert(report.result.numRecordsDeleted);
                  assert.equal(report.result.numRecordsDeleted, 1);

                  return done();
                });
            });
        });
    });
  });
});
