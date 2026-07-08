require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const connectDB = require('./config/db');

const app = express();
app.set('trust proxy', true);
app.use(cors({ origin: (process.env.CORS_ORIGINS || '*').split(','), credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(morgan('dev'));

// Health
app.get('/api/health', (req, res) => res.json({ status: 'ok', service: 'resonance-erp', time: new Date().toISOString() }));
app.get('/api/', (req, res) => res.json({ message: 'Resonance International School ERP API', version: '1.0.0' }));

// Routes — all under /api prefix
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/students', require('./routes/students'));
app.use('/api/teachers', require('./routes/teachers'));
app.use('/api/attendance', require('./routes/attendance'));
app.use('/api/leaves', require('./routes/leaves'));
app.use('/api/timetable', require('./routes/timetable'));
app.use('/api/fees', require('./routes/fees'));
app.use('/api/holidays', require('./routes/holidays'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/announcements', require('./routes/announcements'));
app.use('/api/enquiries', require('./routes/enquiries'));
app.use('/api/audit', require('./routes/audit'));
app.use('/api/analytics', require('./routes/analytics'));
app.use('/api/remarks', require('./routes/remarks'));
app.use('/api/reports', require('./routes/reports'));

// Global error handler
app.use((err, req, res, next) => {
  console.error('[error]', err);
  res.status(err.status || 500).json({ error: err.message || 'Internal server error' });
});

const PORT = parseInt(process.env.PORT || '8001', 10);
const HOST = '0.0.0.0';

connectDB()
  .then(() => {
    app.listen(PORT, HOST, () => {
      console.log(`[server] Resonance ERP API listening on ${HOST}:${PORT}`);
    });
  })
  .catch(err => {
    console.error('[server] failed to start', err);
    process.exit(1);
  });
