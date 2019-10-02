const _ = require('@sailshq/lodash');

class WrappedConnection {

  constructor(pool) {
    this.pool = pool;
    this.connectionAcquired = false;
    this.connectionReleased = false;
    this.id = Math.floor(Math.random() * (10000 - 100) + 100);
  }

  get connected() {
    return this.connectionAcquired && !this.connectionReleased;
  }

  getCurrentTransaction() {
    return this._currentTransaction;
  }

  setCurrentTransaction(transaction) {
    this._currentTransaction = transaction;
  }

  removeCurrentTransaction() {
    this._currentTransaction = null;
  }

  setConnection({connection, config}) {
    this.connection = connection;
    this.config = config;
    this.connectionAcquired = true;
  }

  acquire(unused, callback) {
    const self = this;

    if (self.connectionReleased) {
      return callback(new Error("Connection already released"));
    }

    if (self.connectionAcquired) {
      return callback(null, self.connection, self.config);
    }

    self.pool.acquire(self.pool, (err, connection, config) => {
      if (!err) {
        self.setConnection({connection, config});
      }
      return callback(err, connection, config);
    });
  }

  release(/*connection*/) {
    //noop
  }

  releaseConnection() {
    const self = this;

    if (!self.connectionAcquired) {
      throw new Error("Connection not acquired");
    }
    if (self.connectionReleased) {
      throw new Error("Connection already released");
    }

    self.pool.release(self.connection);
    self.connection = null;
    self.config = null;
    self.connectionReleased = true;
  }
}


module.exports = {
  validateConnection: function (connection) {
    return _.isObject(connection) &&
      _.isFunction(connection.release) &&
      _.isFunction(connection.releaseConnection);
  },

  WrappedConnection: WrappedConnection
};
