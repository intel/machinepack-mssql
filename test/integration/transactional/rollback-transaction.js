var assert = require('assert');
var Pack = require('../../../');
var {config} = require('../../config');

describe('Transactional ::', function () {
  describe('Rollback Transaction', function () {
    var manager;
    var connection;

    // Create a manager, a connection, and a table
    before(async function () {

      let report = await Pack.createManager({
        meta: config
      });

      // Store the manager
      manager = report.manager;

      report = await Pack.getConnection({
        manager: manager
      });

      // Store the connection
      connection = report.connection;

      // Create a table to use for testing
      await Pack.sendNativeQuery({
        connection: connection,
        nativeQuery: 'IF OBJECT_ID(\'dbo.people\') IS NULL BEGIN CREATE TABLE people(id int identity(1,1) primary key, name varchar(255) ) END;'
      });

      await Pack.sendNativeQuery({
        connection: connection,
        nativeQuery: 'IF OBJECT_ID(\'dbo.people2\') IS NULL BEGIN CREATE TABLE people2(id int identity(1,1) primary key, name varchar(255) ) END;'
      });
    });

    // Afterwards destroy the table and release the connection
    after(async function () {
      await Pack.sendNativeQuery({
        connection: connection,
        nativeQuery: 'DROP TABLE people;'
      });

      await Pack.sendNativeQuery({
        connection: connection,
        nativeQuery: 'DROP TABLE people2;'
      });

      await Pack.releaseConnection({
        connection: connection
      });

      await Pack.destroyManager({
        manager: manager
      });
    });

    // To Test:
    // * Open a transaction on connection and insert a record into the DB
    // * Run a query on connection and make sure the record exist
    // * Rollback the transaction
    // * Run the select query again and the record should not exist
    it('should perform a transaction and make sure the results are rolled back correctly', async function () {
      // Start a transaction
      await Pack.beginTransaction({
        connection: connection
      });

      // Insert a record using the transaction
      await Pack.sendNativeQuery({
        connection: connection,
        nativeQuery: 'INSERT INTO people (name) OUTPUT inserted.* VALUES (\'hugo\');'
      });

      await Pack.sendNativeQuery({
        connection: connection,
        nativeQuery: 'INSERT INTO people2 (name) OUTPUT inserted.* VALUES (\'hugo\');'
      });

      // Query the table and ensure the record does exist
      let report = await Pack.sendNativeQuery({
        connection: connection,
        nativeQuery: 'SELECT * FROM people;'
      });

      // Ensure 1 result were returned
      assert.equal(report.result.rowCount, 1);

      // Query the table and ensure the record does exist
      report = await Pack.sendNativeQuery({
        connection: connection,
        nativeQuery: 'SELECT * FROM people2;'
      });

      // Ensure 1 result were returned
      assert.equal(report.result.rowCount, 1);

      // Rollback the transaction
      await Pack.rollbackTransaction({
        connection: connection
      });
      // Query the table using and ensure the record doesn't exist
      report = await Pack.sendNativeQuery({
        connection: connection,
        nativeQuery: 'SELECT * FROM people;'
      });

      // Ensure no results were returned
      assert.equal(report.result.rowCount, 0);

      report = await Pack.sendNativeQuery({
        connection: connection,
        nativeQuery: 'SELECT * FROM people2;'
      });

      // Ensure no results were returned
      assert.equal(report.result.rowCount, 0);
    });
  });
});
