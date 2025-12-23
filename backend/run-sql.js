require('dotenv').config();
const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

async function runSQL() {
  let connection;

  try {
    // Connect to database
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'project',
      port: process.env.DB_PORT || 3306,
      multipleStatements: true,
      ssl: {
        rejectUnauthorized: false
      }
    });

    console.log('✅ Connected to database');

    // Read SQL file
    const sqlFilePath = path.join(__dirname, '..', 'requirements', 'mandasql_clean.sql');
    const sql = fs.readFileSync(sqlFilePath, 'utf8');

    console.log('📄 Read SQL file, executing...');

    // Split SQL into individual statements and execute them one by one
    const statements = sql.split(';').filter(stmt => stmt.trim().length > 0);

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i].trim();
      if (statement) {
        try {
          console.log(`Executing statement ${i + 1}/${statements.length}...`);
          await connection.execute(statement + ';');
        } catch (error) {
          console.error(`❌ Error in statement ${i + 1}:`, error.message);
          console.error('Statement:', statement.substring(0, 200) + '...');
          throw error;
        }
      }
    }

    console.log('✅ All SQL statements executed successfully');

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔌 Database connection closed');
    }
  }
}

runSQL();
