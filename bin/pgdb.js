const pg = require('pg');
const credentials = require('./credentials');

var config = {
    user: credentials.username,
    database: credentials.database,
    password: credentials.password,
    host: credentials.server,
    port: 5432
};

const pool = new pg.Pool(config);

pool.on('error', function (err, client) {

    console.error('idle client error', err.message, err.stack);
});

module.exports.pool = pool;

module.exports.connect = function (callback) {
  return pool.connect(callback);
};
