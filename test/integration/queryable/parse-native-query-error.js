var assert = require('assert');
var _ = require('@sailshq/lodash');
var Pack = require('../../../');
var {config} = require('../../config');

describe('Queryable ::', function () {
  describe('Parse Native Query Error', function () {
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
        nativeQuery: 'IF OBJECT_ID(\'dbo.people\') IS NULL BEGIN CREATE TABLE people(name varchar(255) UNIQUE) END;'
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

    it('should normalize UNIQUE constraint errors', async function () {
      // Insert two records with identical names
      try {
        await Pack.sendNativeQuery({
          connection: connection,
          nativeQuery: 'INSERT INTO "people" VALUES (\'Batman\'), (\'Batman\');'
        });
      } catch (err) {
        assert(err);
        assert.equal(err.exit, 'queryFailed');

        let report = await Pack.parseNativeQueryError({
          nativeQueryError: err.raw.error
        });

        assert(report.footprint);
        assert(report.footprint.identity);
        assert.equal(report.footprint.identity, 'notUnique');
        assert(_.isArray(report.footprint.keys));
        assert.equal(report.footprint.keys.length, 1);
        assert.equal(report.footprint.keys[0].indexOf('Constraint='), 0);
      }
    });
  });
});
