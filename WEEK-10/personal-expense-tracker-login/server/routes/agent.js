import express from 'express';
import Transaction from '../models/Transaction.js';

const router = express.Router();
const money = (n) => `₹${Number(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;

function monthRange(month) {
  if (!/^\d{4}-\d{2}$/.test(month || '')) return null;
  const [year, monthNumber] = month.split('-').map(Number);
  if (monthNumber < 1 || monthNumber > 12) return null;
  return { start: new Date(Date.UTC(year, monthNumber - 1, 1)), end: new Date(Date.UTC(year, monthNumber, 1)) };
}

async function getFinancialContext(month, userId) {
  const range = monthRange(month);
  if (!range) throw new Error('Month must use YYYY-MM format.');
  const previousDate = new Date(Date.UTC(range.start.getUTCFullYear(), range.start.getUTCMonth() - 1, 1));
  const previousMonth = `${previousDate.getUTCFullYear()}-${String(previousDate.getUTCMonth() + 1).padStart(2, '0')}`;
  const previousRange = monthRange(previousMonth);
  // AI receives only the logged-in user's current and previous month transactions.
  const all = await Transaction.find({ user: userId, date: { $gte: previousRange.start, $lt: range.end } }).sort({ date: -1 }).lean();
  const summarize = (items) => {
    const income = items.filter((x) => x.type === 'income').reduce((sum, x) => sum + x.amount, 0);
    const expenses = items.filter((x) => x.type === 'expense').reduce((sum, x) => sum + x.amount, 0);
    const byCategory = {};
    items.filter((x) => x.type === 'expense').forEach((x) => { byCategory[x.category] = (byCategory[x.category] || 0) + x.amount; });
    return { income, expenses, balance: income - expenses, count: items.length, byCategory };
  };
  const currentItems = all.filter((x) => x.date >= range.start && x.date < range.end);
  const previousItems = all.filter((x) => x.date >= previousRange.start && x.date < previousRange.end);
  return {
    month, previousMonth,
    current: summarize(currentItems), previous: summarize(previousItems),
    recentTransactions: currentItems.slice(0, 12).map(({ type, amount, category, description, date }) => ({ type, amount, category, description, date }))
  };
}

function buildAdvice(ctx, question = '') {
  const current = ctx.current, previous = ctx.previous;
  const top = Object.entries(current.byCategory).sort((a, b) => b[1] - a[1])[0];
  const change = previous.expenses > 0 ? ((current.expenses - previous.expenses) / previous.expenses) * 100 : null;
  const q = question.toLowerCase();
  const lines = [];
  if (!current.count) {
    lines.push(`I don't see transactions for ${ctx.month} yet. Add your income and expenses first, then I can give more personalised advice.`);
  } else {
    lines.push(`For ${ctx.month}, you recorded ${money(current.income)} income and ${money(current.expenses)} in expenses. Your balance is ${money(current.balance)}.`);
    if (top) lines.push(`Your highest-spending category is ${top[0]} at ${money(top[1])}. Review the last few purchases in this category and set a weekly limit.`);
    if (change !== null) lines.push(`Compared with ${ctx.previousMonth}, expenses are ${change > 0 ? 'up' : change < 0 ? 'down' : 'unchanged'} by ${Math.abs(change).toFixed(1)}%.`);
    if (current.balance < 0) lines.push('Your expenses exceed your income for this month. Pause non-essential purchases and prioritise bills before discretionary spending.');
    else if (current.income > 0) lines.push(`Your current savings rate is ${((current.balance / current.income) * 100).toFixed(1)}%. Consider setting an automatic savings target of 10–20% of income if your essential costs allow it.`);
  }
  if (['food', 'travel', 'shopping', 'category', 'spend most'].some((term) => q.includes(term))) {
    const categories = Object.entries(current.byCategory).sort((a, b) => b[1] - a[1]).slice(0, 5);
    lines.push(categories.length ? `Category ranking: ${categories.map(([name, amount], index) => `${index + 1}. ${name}: ${money(amount)}`).join('; ')}.` : 'There is no expense category data for this month yet.');
  }
  if (['save', 'reduce', 'budget'].some((term) => q.includes(term))) {
    lines.push('Try this plan: (1) choose a realistic weekly discretionary budget, (2) review subscriptions and impulse purchases, (3) set a category cap for your largest expense, and (4) compare actual spending every Sunday.');
  }
  if (['compare', 'last month', 'previous'].some((term) => q.includes(term))) {
    lines.push(`Previous month (${ctx.previousMonth}): income ${money(previous.income)}, expenses ${money(previous.expenses)}, balance ${money(previous.balance)}.`);
  }
  return lines.join('\n\n');
}

async function answerWithGemini(question, context, fallback) {
  const key = process.env.GEMINI_API_KEY;
  if (!key) return { answer: fallback, mode: 'built-in-agent' };
  const model = process.env.GEMINI_MODEL || 'gemini-2.0-flash';
  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(key)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: `You are Pennywise, a friendly personal-finance education assistant. Use only the supplied transaction summary; do not invent facts. Give practical, cautious suggestions, not professional investment/tax advice. Currency is INR.\nSummary JSON: ${JSON.stringify(context)}\nUser question: ${question}\nAnswer in clear short paragraphs and bullet points where useful.` }] }],
        generationConfig: { temperature: 0.4, maxOutputTokens: 700 }
      })
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error?.message || 'Gemini request failed');
    const answer = data.candidates?.[0]?.content?.parts?.map((part) => part.text || '').join('').trim();
    if (!answer) throw new Error('Empty Gemini response');
    return { answer, mode: 'gemini' };
  } catch (error) {
    console.error('Gemini unavailable; using built-in agent:', error.message);
    return { answer: `${fallback}\n\n(AI provider unavailable, so these are built-in data-based suggestions.)`, mode: 'built-in-agent' };
  }
}

router.get('/insights', async (req, res, next) => {
  try {
    const month = String(req.query.month || new Date().toISOString().slice(0, 7));
    const context = await getFinancialContext(month, req.user.id);
    res.json({ month, previousMonth: context.previousMonth, insights: buildAdvice(context), context });
  } catch (error) {
    if (error.message.startsWith('Month must')) return res.status(400).json({ message: error.message });
    next(error);
  }
});

router.post('/chat', async (req, res, next) => {
  try {
    const question = String(req.body?.message || '').trim();
    const month = String(req.body?.month || new Date().toISOString().slice(0, 7));
    if (!question) return res.status(400).json({ message: 'Please enter a question for the financial agent.' });
    if (question.length > 1000) return res.status(400).json({ message: 'Question must be 1000 characters or fewer.' });
    const context = await getFinancialContext(month, req.user.id);
    const fallback = buildAdvice(context, question);
    const result = await answerWithGemini(question, context, fallback);
    res.json({ ...result, month, timestamp: new Date().toISOString() });
  } catch (error) {
    if (error.message.startsWith('Month must')) return res.status(400).json({ message: error.message });
    next(error);
  }
});

export default router;
