const mysql = require('mysql2/promise');

let connectionPromise = null;
let connectionInUse = false;
let lastUsedTime = Date.now();

const CONNECTION_TIMEOUT = 5 * 60 * 1000;

async function getConnection() {
  const currentTime = Date.now();
  
  if (connectionPromise && !connectionInUse && (currentTime - lastUsedTime > CONNECTION_TIMEOUT)) {
    try {
      const conn = await connectionPromise;
      await conn.end();
      connectionPromise = null;
      console.log('Closed idle connection');
    } catch (err) {
      console.error('Error closing idle connection:', err);
      connectionPromise = null;
    }
  }

  if (!connectionPromise) {
    connectionPromise = mysql.createConnection({
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      connectTimeout: 20000, 
      namedPlaceholders: true
    });
    console.log('Creating new database connection');
  }

  connectionInUse = true;
  lastUsedTime = currentTime;
  return connectionPromise;
}

async function executeQuery(sql, params = []) {
  let connection;
  try {
    connection = await getConnection();
    const [results] = await connection.query(sql, params);
    return results;
  } catch (error) {
    console.error('Database query error:', error);
    
    if (error.code === 'PROTOCOL_CONNECTION_LOST' || 
        error.code === 'ECONNREFUSED' || 
        error.code === 'ER_MAX_USER_CONNECTIONS') {
      connectionPromise = null;
    }
    
    throw error;
  } finally {
    connectionInUse = false;
    lastUsedTime = Date.now();
  }
}

module.exports = {
  executeQuery
};