const mysql = require('mysql2/promise');
const session = require('express-session');
const MySQLStore = require('express-mysql-session')(session);

const pool = mysql.createPool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    connectionLimit: 1,       
    waitForConnections: true, 
    queueLimit: 10,        
    enableKeepAlive: true,  
    keepAliveInitialDelay: 10000
});

const options = {
    createDatabaseTable: true,
    schema: {
        tableName: 'sessions',
        columnNames: {
            session_id: 'session_id',
            expires: 'expires',
            data: 'data'
        }
    },
    clearExpired: true,
    checkExpirationInterval: 900000,
    expiration: 86400000,           
};

const sessionStore = new MySQLStore(options, pool);

sessionStore.on('error', function(error) {
    console.error('Session store error:', error);
});

module.exports = sessionStore;