
const config = {
  server: process.env.MSSQL_HOST || 'localhost',
  port: process.env.MSSQL_PORT || 1433,
  user: process.env.MSSQL_USER || 'sails',
  password: process.env.MSSQL_PASSWORD || 'sails',
  database: process.env.MSSQL_DB || 'sails-test',
};

module.exports = {
  config: config
};
