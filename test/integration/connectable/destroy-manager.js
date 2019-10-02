var Pack = require('../../../');
var {config} = require('../../config');

describe('Connectable ::', function () {
  describe('Destroy Manager', function () {

    let manager;

    // Create a manager
    before(async function () {
      let report = await Pack.createManager({
        meta: config
      });

      manager = report.manager;
    });

    it('should successfully destroy the manager', function () {
      Pack.destroyManager({
        manager: manager
      }).execSync();
    });
  });
});
