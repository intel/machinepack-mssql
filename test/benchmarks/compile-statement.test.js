var runBenchmarks = require('../support/benchmark-runner');
var Compiler = require('../../index').compileStatement;

//  ╔╗ ╔═╗╔╗╔╔═╗╦ ╦╔╦╗╔═╗╦═╗╦╔═╔═╗
//  ╠╩╗║╣ ║║║║  ╠═╣║║║╠═╣╠╦╝╠╩╗╚═╗
//  ╚═╝╚═╝╝╚╝╚═╝╩ ╩╩ ╩╩ ╩╩╚═╩ ╩╚═╝
describe('Benchmark :: Compile Statement', function() {
  // Set "timeout" and "slow" thresholds incredibly high
  // to avoid running into issues.
  this.slow(240000);
  this.timeout(240000);

  it('should be performant enough', function() {
    runBenchmarks('Compiler.execSync()', [
      function compileSelect() {
        Compiler({
          statement: {
            select: ['title', 'author', 'year'],
            from: 'books'
          }
        }).execSync();
      },

      function compileInsert() {
        Compiler({
          statement: {
            insert: {
              title: 'Slaughterhouse Five'
            },
            into: 'books'
          }
        }).execSync();
      },

      function compileUpdate() {
        Compiler({
          statement: {
            update: {
              status: 'archived'
            },
            where: {
              publishedDate: { '>': 2000 }
            },
            using: 'books'
          }
        }).execSync();
      },

      function compileDelete() {
        Compiler({
          statement: {
            del: true,
            from: 'accounts',
            where: {
              activated: false
            }
          }
        }).execSync();
      }
    ]);
  });
});
