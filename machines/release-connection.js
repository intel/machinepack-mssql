// Dependencies
const util = require('./private/util');

module.exports = {


  friendlyName: 'Release connection',


  description: 'Release an active Mssql database connection back to the pool.',


  inputs: {

    connection: {
      friendlyName: 'Connection',
      description: 'An active database connection.',
      extendedDescription: 'The provided database connection instance must still be active. Only database ' +
        'connection instances created by the `getConnection()` machine in this driver are supported.',
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
      description: 'The connection was released and is no longer active.',
      extendedDescription: 'The provided connection may no longer be used for any subsequent queries.',
      outputVariableName: 'report',
      outputDescription: 'The `meta` property is reserved for custom driver-specific extensions.',
      outputExample: '===',
      // example: {
      //   meta: '==='
      // }
    },

    badConnection: {
      friendlyName: 'Bad connection',
      description: 'The provided connection is not valid or no longer active. Are you sure it was obtained by ' +
        'calling this driver\'s `getConnection()` method?',
      extendedDescription: 'Usually, this means the connection to the database was lost due to a logic error or ' +
        'timing issue in userland code. In production, this can mean that the database became overwhelemed or was ' +
        'shut off while some business logic was in progress.',
      outputVariableName: 'report',
      outputDescription: 'The `meta` property is reserved for custom driver-specific extensions.',
      outputExample: '===',
      // example: {
      //   meta: '==='
      // }
    }

  },


  fn: function releaseConnection(inputs, exits) {
    if (!util.validateConnection(inputs.connection)) {
      return exits.badConnection();
    }

    // Release connection.
    try {
      inputs.connection.releaseConnection();
    } catch (e) {
      return exits.error(e);
    }

    return exits.success({
      meta: inputs.meta
    });
  }


};
