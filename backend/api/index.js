// Vercel serverless entry point for the Express backend.
// This wraps the existing Express `app` from server.js so Vercel can invoke it as a single function.
// Notes:
//   - `app.listen()` is skipped when VERCEL is set (see server.js).
//   - MongoDB connection is cached across warm invocations to avoid re-connecting on every request.
const mongoose = require('mongoose');
const app = require('../server');

let cachedConn = null;

async function ensureDb() {
  if (cachedConn && mongoose.connection.readyState === 1) return cachedConn;
  cachedConn = mongoose.connect(process.env.MONGO_URL, { dbName: process.env.DB_NAME });
  return cachedConn;
}

module.exports = async (req, res) => {
  try {
    await ensureDb();
  } catch (e) {
    console.error('[api] db connect failed', e);
    return res.status(500).json({ error: 'Database connection failed' });
  }
  return app(req, res);
};
