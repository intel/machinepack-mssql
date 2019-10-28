var assert = require('assert');
var _ = require('@sailshq/lodash');
var Pack = require('../../../');
var {config} = require('../../config');

describe('Queryable ::', function () {
  describe('Parse Native Query Result', function () {
    var manager;
    var connection;

    // Create a manager and connection
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
        nativeQuery: 'IF OBJECT_ID(\'dbo.people\') IS NULL BEGIN CREATE TABLE people(id int identity(1,1) primary key, name varchar(255), age int) END;'
      });
    });

    // Afterwards destroy the test table and release the connection
    after(async function () {
      await Pack.sendNativeQuery({
        connection: connection,
        nativeQuery: 'DROP TABLE people;'
      });

      await Pack.releaseConnection({
        connection: connection
      });

      await Pack.destroyManager({
        manager: manager
      });
    });

    it('should normalize SELECT query results from a native query', async function () {
      let report = await Pack.sendNativeQuery({
        connection: connection,
        nativeQuery: 'SELECT * from people;'
      });

      var result = report.result;

      report = await Pack.parseNativeQueryResult({
        queryType: 'select',
        nativeQueryResult: result
      });

      assert(report.result);
      assert(_.isArray(report.result));
      assert.equal(report.result.length, 0);
    });

    it('should normalize INSERT query results from a native query', async function () {
      let report = await Pack.sendNativeQuery({
        connection: connection,
        nativeQuery: 'INSERT INTO people (name) OUTPUT INSERTED.*  VALUES (\'hugo\');'
      });

      var result = report.result;

      report = await Pack.parseNativeQueryResult({
        queryType: 'insert',
        nativeQueryResult: result
      });

      assert(report.result);
      assert(report.result.inserted);
    });

    it('should normalize UPDATE query results from a native query', async function () {
      let report = await Pack.sendNativeQuery({
        connection: connection,
        nativeQuery: 'INSERT INTO people (name) OUTPUT inserted.* VALUES (\'hugo\');'
      });

      report = await Pack.sendNativeQuery({
        connection: connection,
        nativeQuery: 'UPDATE people SET name = \'George\' where id = ' + report.result.rows[0].id + ';'
      });

      var result = report.result;

      report = await Pack.parseNativeQueryResult({
        queryType: 'update',
        nativeQueryResult: result
      });

      assert(report.result);
      assert(report.result.numRecordsUpdated);
      assert.equal(report.result.numRecordsUpdated, 1);
    });

    it('should normalize DELETE query results from a native query', async function () {
      let report = await Pack.sendNativeQuery({
        connection: connection,
        nativeQuery: 'INSERT INTO people (name) VALUES (\'Sally\');'
      });

      // Ensure that the record inserted ok
      assert.equal(report.result.rowCount, 1);

      report = await Pack.sendNativeQuery({
        connection: connection,
        nativeQuery: 'DELETE FROM people WHERE name = \'Sally\';'
      });

      var result = report.result;

      report = await Pack.parseNativeQueryResult({
        queryType: 'delete',
        nativeQueryResult: result
      });

      assert(report.result);
      assert(report.result.numRecordsDeleted);
      assert.equal(report.result.numRecordsDeleted, 1);
    });

    it('should normalize SUM query results from a native query', async function () {
      let report = await Pack.sendNativeQuery({
        connection: connection,
        nativeQuery: 'INSERT INTO people (name, age) VALUES (\'John Smith\', 20); ' +
          'INSERT INTO people (name, age) VALUES (\'Alice Smith\', 20); ' +
          'INSERT INTO people (name) VALUES (\'Unknown\');'
      });

      report = await Pack.sendNativeQuery({
        connection: connection,
        nativeQuery: 'SELECT sum(age) FROM people WHERE name in (\'John Smith\', \'Alice Smith\', \'Unknown\');'
      });

      var result = report.result;

      report = await Pack.parseNativeQueryResult({
        queryType: 'sum',
        nativeQueryResult: result
      });

      assert(report.result);
      assert.equal(report.result, 40);
    });

    it('should normalize COUNT query results from a native query', async function () {
      await Pack.sendNativeQuery({
        connection: connection,
        nativeQuery: 'INSERT INTO people (name, age) VALUES (\'John Smith_101\', 20); ' +
          'INSERT INTO people (name, age) VALUES (\'Alice Smith_101\', 20); ' +
          'INSERT INTO people (name) VALUES (\'Unknown_101\');'
      });

      let report = await Pack.sendNativeQuery({
        connection: connection,
        nativeQuery: 'SELECT count(*) FROM people WHERE name in (\'John Smith_101\', \'Alice Smith_101\');'
      });

      assert(report.result);

      report = await Pack.parseNativeQueryResult({
        queryType: 'count',
        nativeQueryResult: report.result
      });

      assert(report.result);
      assert.equal(report.result, 2);
    });

    it('should normalize AVG query results from a native query', async function () {
      await Pack.sendNativeQuery({
        connection: connection,
        nativeQuery: 'INSERT INTO people (name, age) VALUES (\'John Smith_201\', 30); ' +
          'INSERT INTO people (name, age) VALUES (\'Alice Smith_201\', 20);'
      });

      let report = await Pack.sendNativeQuery({
        connection: connection,
        nativeQuery: 'SELECT avg (age) FROM people WHERE name in (\'John Smith_201\', \'Alice Smith_201\');'
      });

      assert(report.result);

      report = await Pack.parseNativeQueryResult({
        queryType: 'avg',
        nativeQueryResult: report.result
      });

      assert(report.result);
      assert.equal(report.result, 25);
    });
  });
});
