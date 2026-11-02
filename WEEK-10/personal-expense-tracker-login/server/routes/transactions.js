import express from 'express';
import mongoose from 'mongoose';
import Transaction from '../models/Transaction.js';

const router = express.Router();

function getMonthRange(month) {
  if (!/^\d{4}-\d{2}$/.test(month || '')) return null;
  const [year, monthNumber] = month.split('-').map(Number);
  if (monthNumber < 1 || monthNumber > 12) return null;
  return { start: new Date(Date.UTC(year, monthNumber - 1, 1)), end: new Date(Date.UTC(year, monthNumber, 1)) };
}
function transactionPayload(body) {
  const { type, amount, category, description = '', date } = body || {};
  if (!['income', 'expense'].includes(type)) return { error: 'Type must be income or expense.' };
  const numericAmount = Number(amount);
  if (!Number.isFinite(numericAmount) || numericAmount <= 0) return { error: 'Enter an amount greater than zero.' };
  if (!String(category || '').trim()) return { error: 'Category is required.' };
  if (!date || Number.isNaN(new Date(`${date}T00:00:00.000Z`).getTime())) return { error: 'A valid transaction date is required.' };
  return { value: { type, amount: numericAmount, category: String(category).trim(), description: String(description).trim(), date: new Date(`${date}T00:00:00.000Z`) } };
}
function formatMonth(date) { return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`; }
function demoTransactions(month, userId) {
  const [year, monthNumber] = month.split('-').map(Number);
  const previousDate = new Date(Date.UTC(year, monthNumber - 2, 1));
  const previousMonth = formatMonth(previousDate);
  const previousExamples = [
    { type: 'income', amount: 52000, category: 'Salary', label: 'salary', day: 1 },
    { type: 'expense', amount: 7600, category: 'Food', label: 'food', day: 5 },
    { type: 'expense', amount: 4200, category: 'Travel', label: 'travel', day: 9 },
    { type: 'expense', amount: 5600, category: 'Bills', label: 'bills', day: 13 },
    { type: 'expense', amount: 4900, category: 'Shopping', label: 'shopping', day: 19 },
    { type: 'expense', amount: 800, category: 'Health', label: 'health', day: 24 }
  ];
  const currentExamples = [
    { type: 'income', amount: 55000, category: 'Salary', label: 'salary', day: 1 },
    { type: 'expense', amount: 6800, category: 'Food', label: 'food', day: 5 },
    { type: 'expense', amount: 3100, category: 'Travel', label: 'travel', day: 9 },
    { type: 'expense', amount: 5600, category: 'Bills', label: 'bills', day: 13 },
    { type: 'expense', amount: 3200, category: 'Shopping', label: 'shopping', day: 19 },
    { type: 'expense', amount: 1200, category: 'Health', label: 'health', day: 24 }
  ];
  const examples = [
    ...previousExamples.map((item) => ({ ...item, month: previousMonth })),
    ...currentExamples.map((item) => ({ ...item, month }))
  ];
  return {
    previousMonth,
    transactions: examples.map(({ month: itemMonth, day, label, ...item }) => {
      const [itemYear, itemMonthNumber] = itemMonth.split('-').map(Number);
      return { ...item, user: userId, description: `Demo data: ${itemMonth} ${label}`, date: new Date(Date.UTC(itemYear, itemMonthNumber - 1, day)) };
    })
  };
}

// GET /api/transactions?month=YYYY-MM
router.get('/', async (req, res, next) => {
  try {
    const query = { user: req.user.id };
    if (req.query.month) {
      const range = getMonthRange(String(req.query.month));
      if (!range) return res.status(400).json({ message: 'Month must use YYYY-MM format.' });
      query.date = { $gte: range.start, $lt: range.end };
    }
    res.json(await Transaction.find(query).sort({ date: -1, createdAt: -1 }));
  } catch (error) { next(error); }
});

// POST /api/transactions/demo-data?month=YYYY-MM
router.post('/demo-data', async (req, res, next) => {
  try {
    const month = String(req.query.month || '');
    const range = getMonthRange(month);
    if (!range) return res.status(400).json({ message: 'Month must use YYYY-MM format.' });
    const { previousMonth, transactions } = demoTransactions(month, req.user.id);
    const previousStart = new Date(Date.UTC(Number(previousMonth.slice(0, 4)), Number(previousMonth.slice(5, 7)) - 1, 1));
    const existing = await Transaction.find({
      user: req.user.id,
      description: { $in: transactions.map((item) => item.description) },
      date: { $gte: previousStart, $lt: range.end }
    }).select('description').lean();
    const existingDescriptions = new Set(existing.map((item) => item.description));
    const missing = transactions.filter((item) => !existingDescriptions.has(item.description));
    if (missing.length) await Transaction.insertMany(missing);
    res.status(201).json({ month, previousMonth, insertedCount: missing.length, existingCount: transactions.length - missing.length });
  } catch (error) { next(error); }
});

// POST /api/transactions
router.post('/', async (req, res, next) => {
  try {
    const parsed = transactionPayload(req.body);
    if (parsed.error) return res.status(400).json({ message: parsed.error });
    const transaction = await Transaction.create({ ...parsed.value, user: req.user.id });
    res.status(201).json(transaction);
  } catch (error) { next(error); }
});

// PUT /api/transactions/:id — only the owner can update their transaction
router.put('/:id', async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ message: 'Invalid transaction ID.' });
    const parsed = transactionPayload(req.body);
    if (parsed.error) return res.status(400).json({ message: parsed.error });
    const transaction = await Transaction.findOneAndUpdate(
      { _id: req.params.id, user: req.user.id }, parsed.value, { new: true, runValidators: true }
    );
    if (!transaction) return res.status(404).json({ message: 'Transaction not found.' });
    res.json(transaction);
  } catch (error) { next(error); }
});

// DELETE /api/transactions/:id — only the owner can delete their transaction
router.delete('/:id', async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ message: 'Invalid transaction ID.' });
    const transaction = await Transaction.findOneAndDelete({ _id: req.params.id, user: req.user.id });
    if (!transaction) return res.status(404).json({ message: 'Transaction not found.' });
    res.json({ message: 'Transaction deleted successfully.' });
  } catch (error) { next(error); }
});

export default router;
