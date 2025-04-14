require("dotenv").config();
const { executeQuery } = require("./connection-manager");

const db = {
  query: async function(sql, params) {
    try {
      const results = await executeQuery(sql, params);
      return [results];
    } catch (error) {
      console.error("Database error:", error);
      throw error;
    }
  }
};

module.exports = { db };