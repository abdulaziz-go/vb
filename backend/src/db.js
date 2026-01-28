import pkg from "pg";
const { Pool } = pkg;
import bcrypt from "bcrypt";

const pool = new Pool({
  user: process.env.DB_USER || "postgres",
  host: process.env.DB_HOST || "localhost",
  database: process.env.DB_NAME || "web_ombor",
  password: process.env.DB_PASSWORD || "postgres",
  port: parseInt(process.env.DB_PORT || "5432"),
});

export const initDB = async () => {
  const client = await pool.connect();
  try {
    // Create documents table
    await client.query(`
      CREATE TABLE IF NOT EXISTS documents (
        id UUID PRIMARY KEY,
        filename TEXT,
        status TEXT DEFAULT 'active',
        signed_by TEXT,
        created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
        signed_at TIMESTAMP WITHOUT TIME ZONE,
        qr_token TEXT,
        file_hash TEXT
      );
    `);

    // Create admins table
    await client.query(`
      CREATE TABLE IF NOT EXISTS admins (
        id SERIAL PRIMARY KEY,
        username TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL
      );
    `);

    // Insert default admin (username: admin, password: admin123)
    const hash = await bcrypt.hash("admin123", 10);
    await client.query(
      `INSERT INTO admins (username, password_hash)
       VALUES ($1, $2)
       ON CONFLICT (username) DO NOTHING`,
      ["admin", hash]
    );

    console.log("✅ Database initialized successfully");
  } catch (err) {
    console.error("❌ Database initialization error:", err);
  } finally {
    client.release();
  }
};

export default pool;
