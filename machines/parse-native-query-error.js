// Dependencies
var _ = require('@sailshq/lodash');
const util = require('util');

module.exports = {


  friendlyName: 'Parse native query error',


  description: 'Attempt to identify and parse a raw error from sending a native ' +
    'query and normalize it to a standard error footprint.',


  moreInfoUrl: 'https://github.com/node-machine/waterline-driver-interface#footprints',


  sync: true,


  inputs: {

    nativeQueryError: {
      description: 'The error sent back from the database as a result of a native query.',
      extendedDescription: 'This is referring to e.g. the output (`err`) returned through the ' +
        '`error` exit of `sendNativeQuery()` in this driver.',
      required: true,
      example: '==='
    },

    meta: {
      friendlyName: 'Meta (custom)',
      description: 'Additional stuff to pass to the driver.',
      extendedDescription: 'This is reserved for custom driver-specific extensions. Please refer ' +
        'to the documentation for the driver you are using for more specific information.',
      example: '==='
    }

  },


  exits: {

    success: {
      description: 'The normalization is complete. If the error cannot be normalized into ' +
        'any other more specific footprint, then the catchall footprint will be returned.',
      outputVariableName: 'report',
      outputDescription: 'The `footprint` property is the normalized "footprint" representing ' +
        'the provided raw error. Conforms to one of a handful of standardized footprint types ' +
        'expected by the Waterline driver interface.  The `meta` property is reserved for custom ' +
        'driver-specific extensions.',
      outputExample: '===',
      // example: {
      //   footprint: {},
      //   meta: '==='
      // }
    }

  },


  fn: function parseNativeQueryError(inputs, exits) {
    // Local variable (`err`) for convenience.
    var err = inputs.nativeQueryError;

    // `footprint` is what will be returned by this machine.
    var footprint = { identity: 'catchall' };

    // If the incoming native query error is not an object, or it is
    // missing a `code` property, then we'll go ahead and bail out w/
    // the "catchall" footprint to avoid continually doing these basic
    // checks in the more detailed error negotiation below.
    if (!_.isObject(err) || !err.code) {
      return exits.success({
        footprint: footprint,
        meta: inputs.meta
      });
    }

    // Negotiate `notUnique` error footprint.
    // ====================================================================
    if (err.number === 2627) {
      footprint.identity = 'notUnique';
      // Now manually extract the relevant bits of the error message
      // to build our footprint's `keys` property:
      footprint.keys = [];
      if (_.isString(err.message)) {
        let pattern = /Violation .* UNIQUE KEY constraint '(.+?)'.*? duplicate key .*? '(.+?)'.*? duplicate key value.+? (\(.+?\))./gm;
        let matches = pattern.exec(err.message);
        if (matches && _.isArray(matches) && _.isString(matches[1])) {
          let info = util.format('Constraint=%s, table=%s, value=%s', matches[1], matches[2], matches[3]);
          footprint.keys.push(info);
        }
      }
    }

    return exits.success({
      footprint: footprint,
      meta: inputs.meta
    });
  }


};
