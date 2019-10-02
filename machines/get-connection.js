const util = require('./private/util');

module.exports = {


  friendlyName: 'Get connection',


  description: 'Get an active connection to the Mssql database from the pool.',


  inputs: {

    manager: {
      friendlyName: 'Manager',
      description: 'The connection manager instance to acquire the connection from.',
      extendedDescription:
        'Only managers built using the `createManager()` method of this driver are supported. ' +
        'Also, the database connection manager instance provided must not have been destroyed--' +
        'i.e. once `destroyManager()` is called on a manager, no more connections can be acquired ' +
        'from it (also note that all existing connections become inactive-- see `destroyManager()` ' +
        'for more on that).',
      example: '===',
      required: true
    },

    meta: {
      friendlyName: 'Meta (custom)',
      description: 'Additional stuff to pass to the driver.',
      extendedDescription: 'This is reserved for custom driver-specific extensions.',
      example: '==='
    }

  },


  exits: {

    success: {
      description: 'A connection was successfully acquired.',
      extendedDescription: 'This connection should be eventually released. Otherwise, it may time out. It is ' +
        'not a good idea to rely on database connections timing out-- be sure to release this connection when finished with it!',
      outputVariableName: 'report',
      outputDescription: 'The `connection` property is an active connection to the database. The `meta` property ' +
        'is reserved for custom driver-specific extensions.',
      outputExample: '==='
      // example: {
      //   connection: '===',
      //   meta: '==='
      // }
    },

    failed: {
      description: 'Could not acquire a connection to the database using the specified manager.',
      extendedDescription: 'This might mean any of the following:\n' +
        ' + the credentials encoded in the connection string are incorrect\n' +
        ' + there is no database server running at the provided host (i.e. even if it is just that the database process needs to be started)\n' +
        ' + there is no software "database" with the specified name running on the server\n' +
        ' + the provided connection string does not have necessary access rights for the specified software "database"\n' +
        ' + this Node.js process could not connect to the database, perhaps because of firewall/proxy settings\n' +
        ' + any other miscellaneous connection error',
      outputVariableName: 'report',
      outputDescription: 'The `error` property is a JavaScript Error instance explaining that a connection could not be made. ' +
        'The `meta` property is reserved for custom driver-specific extensions.',
      outputExample: '===',
      // example: {
      //   error: '===',
      //   meta: '==='
      // }
    }

  },


  fn: function getConnection(inputs, exits) {
    const wrappedConnection = new util.WrappedConnection(inputs.manager.pool);
    wrappedConnection.acquire(null, (err /*, connection, config */) => {
      if (err) {
        return exits.failed({
          error: err,
          meta: inputs.meta
        });
      }

      return exits.success({
        connection: wrappedConnection,
        meta: inputs.meta
      });
    });
  }

};
