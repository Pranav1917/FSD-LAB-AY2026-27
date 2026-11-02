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

// GET /api/summary?month=YYYY-MM
router.get('/', async (req, res, next) => {
  try {
    const now = new Date();
    const month = String(req.query.month || `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`);
    const range = getMonthRange(month);
    if (!range) return res.status(400).json({ message: 'Month must use YYYY-MM format.' });

    const userId = new mongoose.Types.ObjectId(req.user.id);
    const match = { user: userId, date: { $gte: range.start, $lt: range.end } };
    const totalsResult = await Transaction.aggregate([
      { $match: match },
      { $group: {
        _id: null,
        income: { $sum: { $cond: [{ $eq: ['$type', 'income'] }, '$amount', 0] } },
        expenses: { $sum: { $cond: [{ $eq: ['$type', 'expense'] }, '$amount', 0] } },
        transactionCount: { $sum: 1 }
      } }
    ]);
    const categoryTotals = await Transaction.aggregate([
      { $match: { ...match, type: 'expense' } },
      { $group: { _id: '$category', total: { $sum: '$amount' }, count: { $sum: 1 } } },
      { $sort: { total: -1 } }
    ]);
    const totals = totalsResult[0] || { income: 0, expenses: 0, transactionCount: 0 };
    const balance = totals.income - totals.expenses;
    res.json({
      month,
      income: totals.income,
      expenses: totals.expenses,
      balance,
      savingsRate: totals.income > 0 ? (balance / totals.income) * 100 : 0,
      transactionCount: totals.transactionCount,
      categoryTotals: categoryTotals.map((item) => ({ category: item._id, total: item.total, count: item.count }))
    });
  } catch (error) { next(error); }
});

export default router;
