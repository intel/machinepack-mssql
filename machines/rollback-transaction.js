module.exports = {


  friendlyName: 'Rollback transaction',


  description: 'Abort and revert (i.e. "roll back") the database transaction that was begun on the specified active connection.',


  extendedDescription: 'The provided connection must already have a transaction begun on it.',


  inputs: {

    connection: {
      friendlyName: 'Connection',
      description: 'An active database connection.',
      extendedDescription: 'The provided database connection instance must still be active. Only database connection ' +
        'instances created by the `getConnection()` machine in this driver are supported.',
      example: '===',
      required: true
    },

    meta: {
      friendlyName: 'Meta (custom)',
      description: 'Additional stuff to pass to the driver.',
      extendedDescription: 'This is reserved for custom driver-specific extensions. Please refer to the documentation ' +
        'for the driver you are using for more specific information.',
      example: '==='
    }

  },


  exits: {

    success: {
      description: 'The transaction was successfully rolled back.',
      extendedDescription: 'Subsequent queries on this connection will no longer be transactional unless a new transaction is begun.',
      outputVariableName: 'report',
      outputDescription: 'The `meta` property is reserved for custom driver-specific extensions.',
      outputExample: '===',
      // example: {
      //   meta: '==='
      // }
    },

    badConnection: {
      friendlyName: 'Bad connection',
      description: 'The provided connection is not valid or no longer active. Are you sure it was obtained by calling this ' +
        'driver\'s `getConnection()` method?',
      extendedDescription: 'Usually, this means the connection to the database was lost due to a logic error or timing issue ' +
        'in userland code. In production, this can mean that the database became overwhelemed or was shut off while some business ' +
        'logic was in progress.',
      outputVariableName: 'report',
      outputDescription: 'The `error` property is a JavaScript Error instance containing the raw error from the database. ' +
        'The `meta` property is reserved for custom driver-specific extensions.',
      outputExample: '===',
      // example: {
      //   meta: '==='
      // }
    }

  },


  fn: function rollbackTransaction(inputs, exits) {

    const tran = inputs.connection.getCurrentTransaction();
    if (!tran) {
      return exits.error(new Error("No transaction found"));
    }
    inputs.connection.removeCurrentTransaction();

    if (tran.tranRolledBack) {
      return exits.success({
        meta: inputs.meta
      });
    }

    tran.rollback(function rollbackTranCb(err) {
      if (err) {
        return exits.error(err);
      }

      return exits.success({
        meta: inputs.meta
      });
    });

  }

};
