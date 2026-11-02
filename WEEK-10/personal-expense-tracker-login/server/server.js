import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import authRouter from './routes/auth.js';
import transactionsRouter from './routes/transactions.js';
import summaryRouter from './routes/summary.js';
import agentRouter from './routes/agent.js';
import requireAuth from './middleware/requireAuth.js';

const app = express();
const PORT = process.env.PORT || 5000;

if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
  console.error('Missing or weak JWT_SECRET. Add a random secret of at least 32 characters to server/.env.');
  process.exit(1);
}

app.use(cors({ origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173' }));
app.use(express.json({ limit: '1mb' }));

app.get('/', (_req, res) => {
  res.json({ message: 'Personal Expense Tracker API is running.' });
});
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected' });
});

// Registration and login are public; /me validates its token inside the router.
app.use('/api/auth', authRouter);
// All financial data and AI endpoints require a valid login token.
app.use('/api/transactions', requireAuth, transactionsRouter);
app.use('/api/summary', requireAuth, summaryRouter);
app.use('/api/agent', requireAuth, agentRouter);

app.use((req, res) => {
  res.status(404).json({ message: `Route not found: ${req.method} ${req.originalUrl}` });
});
app.use((error, _req, res, _next) => {
  console.error(error);
  if (error.name === 'ValidationError' || error.name === 'CastError') {
    return res.status(400).json({ message: error.message });
  }
  res.status(500).json({ message: 'Server error. Check the backend terminal.' });
});

try {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/personal_expense_tracker');
  console.log('Connected to MongoDB.');
  app.listen(PORT, () => console.log(`API running at http://localhost:${PORT}`));
} catch (error) {
  console.error('MongoDB connection failed. Start MongoDB and check server/.env.');
  console.error(error.message);
  process.exit(1);
}
