var assert = require('assert');
var Pack = require('../../../');
var {config} = require('../../config');

describe('Transactional ::', function () {
  describe('Commit Transaction', function () {
    var manager;
    var connectionA;
    var connectionB;

    // Create a manager, two connections, and a table
    before(async function () {

      let report = await Pack.createManager({
        meta: config
      });
      manager = report.manager;

      report = await Pack.getConnection({
        manager: manager
      });
      // Store the connection
      connectionA = report.connection;

      report = await Pack.getConnection({
        manager: manager
      });
      // Store the connection
      connectionB = report.connection;

      // Create a table to use for testing
      await Pack.sendNativeQuery({
        connection: connectionA,
        nativeQuery: 'IF OBJECT_ID(\'dbo.people\') IS NULL BEGIN CREATE TABLE people(id int identity(1,1) primary key, name varchar(255) ) END;'
      });
      await Pack.sendNativeQuery({
        connection: connectionA,
        nativeQuery: 'IF OBJECT_ID(\'dbo.people2\') IS NULL BEGIN CREATE TABLE people2(id int identity(1,1) primary key, name varchar(255) ) END;'
      });
    });


    after(async function () {
      await Pack.sendNativeQuery({
        connection: connectionA,
        nativeQuery: 'DROP TABLE people;'
      });
      await Pack.sendNativeQuery({
        connection: connectionA,
        nativeQuery: 'DROP TABLE people2;'
      });
      await Pack.releaseConnection({
        connection: connectionA
      });
      await Pack.releaseConnection({
        connection: connectionB
      });
      await Pack.destroyManager({
        manager: manager
      });
    });

    // To Test:
    // * Open a transaction on connectionA and insert a record into the DB
    // * Run a query on connectionB and make sure the record doesn't exist
    // * Commit the transaction
    // * Run the select query again and the record should exist
    it('should perform a transaction and make sure the results are commited correctly', async function () {
      // Start a transaction on connection A
      await Pack.beginTransaction({
        connection: connectionA
      });

      // Insert a record using the transaction
      await Pack.sendNativeQuery({
        connection: connectionA,
        nativeQuery: 'INSERT INTO people (name) OUTPUT inserted.* VALUES (\'hugo\');'
      });

      // Query the table using connection B and ensure the record doesn't exist
      await Pack.sendNativeQuery({
        connection: connectionA,
        nativeQuery: 'INSERT INTO people2 (name) OUTPUT inserted.* VALUES (\'newton\');'
      });

      // Commit the transaction
      await Pack.commitTransaction({
        connection: connectionA
      });

      // Query the table using connection B and ensure the record does exist
      let report = await Pack.sendNativeQuery({
        connection: connectionB,
        nativeQuery: 'SELECT * FROM people;'
      });

      // Ensure 1 result was returned
      assert.equal(report.result.rowCount, 1);

      report = await Pack.sendNativeQuery({
        connection: connectionB,
        nativeQuery: 'SELECT * FROM people2;'
      });

      assert.equal(report.result.rowCount, 1);
    });
  });
});
