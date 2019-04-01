// Dependencies
var util = require('util');
var _ = require('@sailshq/lodash');
var debug = require('debug')('query');
var mssql = require('mssql');

module.exports = {


  friendlyName: 'Send native query',


  description: 'Send a native query to the MSSQL database.',


  inputs: {

    connection: {
      friendlyName: 'Connection',
      description: 'An active database connection.',
      extendedDescription: 'The provided database connection instance must still be active.  Only database connection instances created by the `getConnection()` machine in this driver are supported.',
      example: '===',
      required: true
    },

    nativeQuery: {
      description: 'A native query for the database.',
      extendedDescription: 'If `valuesToEscape` is provided, this supports template syntax like `$1`, `$2`, etc.',
      whereToGet: {
        description: 'Write a native query for this database, or if this driver supports it, use `compileStatement()` to build a native query from Waterline syntax.',
        extendedDescription: 'This might be compiled from a Waterline statement (stage 4 query) using "Compile statement", however it could also originate directly from userland code.'
      },
      example: 'SELECT * FROM pets WHERE species=$1 AND nickname=$2',
      required: true
    },

    valuesToEscape: {
      description: 'An optional list of strings, numbers, or special literals (true, false, or null) to escape and include in the native query, in order.',
      extendedDescription: 'The first value in the list will be used to replace `$1`, the second value to replace `$2`, and so on.  Note that numbers, `true`, `false`, and `null` are interpreted _differently_ than if they were strings wrapped in quotes.  This array must never contain any arrays or dictionaries.',
      example: '===',
      defaultsTo: []
    },

    meta: {
      friendlyName: 'Meta (custom)',
      description: 'Additional stuff to pass to the driver.',
      extendedDescription: 'This is reserved for custom driver-specific extensions.  Please refer to the documentation for the driver you are using for more specific information.',
      example: '==='
    }

  },


  exits: {

    success: {
      description: 'The native query was executed successfully.',
      outputVariableName: 'report',
      outputDescription: 'The `result` property is the result data the database sent back.  The `meta` property is reserved for custom driver-specific extensions.',
      moreInfoUrl: 'https://github.com/felixge/node-mssql#getting-the-id-of-an-inserted-row',
      outputExample: '==='
      // outputExample: {
      //   result: '===',
      //   meta: '==='
      // }
    },

    queryFailed: {
      description: 'The database returned an error when attempting to execute the native query.',
      outputVariableName: 'report',
      outputDescription: 'The `error` property is a JavaScript Error instance with more details about what went wrong.  The `meta` property is reserved for custom driver-specific extensions.',
      outputExample: '==='
      // outputExample: {
      //   error: '===',
      //   meta: '==='
      // }
    },

    badConnection: {
      friendlyName: 'Bad connection',
      description: 'The provided connection is not valid or no longer active.  Are you sure it was obtained by calling this driver\'s `getConnection()` method?',
      extendedDescription: 'Usually, this means the connection to the database was lost due to a logic error or timing issue in userland code.  In production, this can mean that the database became overwhelemed or was shut off while some business logic was in progress.',
      outputVariableName: 'report',
      outputDescription: 'The `meta` property is reserved for custom driver-specific extensions.',
      outputExample: '==='
      // outputExample: {
      //   meta: '==='
      // }
    }

  },


  fn: async function sendNativeQuery(inputs, exits) {
    try {
      var validateConnection = require('./private/validate-connection');

      // Validate provided connection.
      if (!validateConnection({ connection: inputs.connection }).execSync()) {
        return exits.badConnection({
          meta: inputs.meta
        });
      }


      // Validate provided native query.
      var sql = inputs.nativeQuery;
      var bindings = inputs.valuesToEscape || [];


      debug('Running SQL Query:');
      debug('SQL: ' + sql);
      debug('Bindings: ' + bindings);
      debug('Connection Id: ' + inputs.connection.id);



      const request = new mssql.Request(inputs.connection.currentTransaction || inputs.connection);


      let queryFn;
      let isProc = false;
      if (sql.length && sql.indexOf(' ') === -1) {
        isProc = true;
      }
      if (isProc) {
        queryFn = request.execute.bind(request);
      }
      else {
        queryFn = request.query.bind(request);
      }

      if (!isProc) {
        if (_.isArray(bindings) && !_.isEmpty(bindings)) {
          // SQL uses '@' for identifying replacement variables, so let's switch from $ to @
          sql = sql.replace(/\$([1-9][0-9]*)/g, '@$1');
          // replacement variables are 1 based, but arrays are 0 based, so we'll push undefined onto the beginning
          bindings.unshift(undefined);
        }
        _.each(bindings, (value, key) => {
          request.input(key, value);
        });
      }
      else {
        if (bindings && bindings.input) {
          _.each(bindings.input, ({ name, type = '', value } = {}) => {
            if (mssql[type.toUpperCase()]) {
              request.input(name, mssql[type.toUpperCase()], value);
            }
            else {
              request.input(name, value);
            }
          });
          _.each(bindings.output, ({ name, type = '', value } = {}) => {
            if (typeof value === 'undefined') {
              request.output(name, mssql[type.toUpperCase()]);
            }
            else {
              request.output(name, mssql[type.toUpperCase()], value);
            }
          });
        }
      }


      // Send native query to the database using node-mssql.
      queryFn(sql, function query() {

        // If the first argument is truthy, then treat it as an error.
        // (i.e. close shop early &gtfo; via the `queryFailed` exit)
        if (arguments[0]) {
          return exits.queryFailed({
            error: arguments[0],
            meta: inputs.meta
          });
        }


        // Otherwise, the query was successful.

        // Since the arguments passed to this callback and their data format
        // can vary across different types of queries, we do our best to normalize
        // that here.  However, in order to do so, we have to be somewhat
        // opinionated; i.e. using the following heuristics when building the
        // standard `result` dictionary:
        //  • If the 2nd arg is an array, we expose it as `result.rows`.
        //  • Otherwise if the 2nd arg is a dictionary, we expose it as `result`.
        //  • If the 3rd arg is an array, we include it as `result.fields`.
        //    (if the 3rd arg is an array AND the 2nd arg is a dictionary, then
        //     the 3rd arg is tacked on as the `fields` property of the 2nd arg.
        //     If the 2nd arg already had `fields`, it is overridden.)
        var normalizedNativeResult;
        if (arguments[1]) {
          // `result :=`
          // `result.rows :=`
          if (_.isArray(arguments[1])) {
            normalizedNativeResult = { rows: arguments[1] };

            // `result :=`
          } else if (_.isObject(arguments[1])) {
            normalizedNativeResult = arguments[1];
          } else {
            return exits.error(new Error('Query was successful, but output from node-mssql is in an unrecognized format.  Output:\n' + util.inspect(Array.prototype.slice.call(arguments), { depth: null })));
          }
        }

        if (arguments[2]) {
          // `result.fields :=`
          if (_.isArray(arguments[2])) {
            normalizedNativeResult.fields = arguments[2];
          } else {
            return exits.error(new Error('Query was successful, but output from node-mssql is in an unrecognized format.  Output:\n' + util.inspect(Array.prototype.slice.call(arguments), { depth: null })));
          }
        }

        // Finally, return the normalized result.
        return exits.success({
          result: normalizedNativeResult,
          meta: inputs.meta
        });

      });
    }
    catch (error) {
      exits.queryFailed({
        error: error,
        meta: inputs.meta
      });
    }

  }


};
