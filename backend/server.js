require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const { neon } = require('@neondatabase/serverless');

const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(cookieParser());

// Initialize Neon Database Connection
// Ensure you have DATABASE_URL set in your .env file
const sql = neon(process.env.DATABASE_URL || 'postgres://user:password@hostname/dbname');

// Test DB Route
app.get('/api/db-test', async (req, res) => {
  try {
    const result = await sql`SELECT version()`;
    res.json({ success: true, data: result[0] });
  } catch (err) {
    console.error('Database connection error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Basic Route
app.get('/', (req, res) => {
  res.send('Backend server is running with Neon DB');
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
