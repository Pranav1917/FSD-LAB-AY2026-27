import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, NavLink, Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const AUTH_TOKEN_KEY = 'pennytrack_token';
const today = new Date().toISOString().slice(0, 10);
const currentMonth = today.slice(0, 7);
const categories = ['Food', 'Travel', 'Shopping', 'Bills', 'Education', 'Health', 'Entertainment', 'Salary', 'Freelancing', 'Investment', 'Gift', 'Other'];
const initialForm = { type: 'expense', amount: '', category: 'Food', description: '', date: today };
const money = (value) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(Number(value || 0));
const prettyDate = (value) => value ? new Date(value).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' }) : '—';

async function request(path, options = {}) {
  const token = localStorage.getItem(AUTH_TOKEN_KEY);
  const response = await fetch(`${API}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {})
    }
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.message || 'Request failed.');
  return data;
}

function Layout({ month, setMonth, children, user, onLogout }) {
  const location = useLocation();
  return (
    <>
      <nav className="navbar navbar-expand-lg navbar-dark app-navbar">
        <div className="container">
          <Link className="navbar-brand fw-bold" to="/">PennyTrack</Link>
          <div className="navbar-nav flex-row gap-2 gap-md-3">
            <NavLink className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} to="/">Dashboard</NavLink>
            <NavLink className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} to="/transactions">Transactions</NavLink>
            <NavLink className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} to="/reports">Reports</NavLink>
            <NavLink className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} to="/agent">AI Agent ✦</NavLink>
          </div>
          <div className="d-flex align-items-center gap-2 ms-lg-3 mt-2 mt-lg-0">
            <span className="navbar-user-name" title={user?.email}>{user?.name}</span>
            <button className="btn btn-sm btn-outline-light logout-button" type="button" onClick={onLogout}>Log out</button>
          </div>
        </div>
      </nav>
      <main className="container py-4 py-lg-5">
        <div className="page-heading d-flex flex-column flex-md-row justify-content-between align-items-md-end gap-3 mb-4">
          <div>
            <p className="eyebrow mb-1">PERSONAL FINANCE</p>
            <h1 className="h2 fw-bold mb-1">{location.pathname === '/transactions' ? 'Transactions' : location.pathname === '/reports' ? 'Monthly reports' : location.pathname === '/agent' ? 'Pennywise AI Agent' : 'Your money, clearly'}</h1>
            <p className="text-secondary mb-0">{location.pathname === '/agent' ? 'Ask questions about your spending and get practical, data-based suggestions.' : 'Track your income, spending, and monthly balance.'}</p>
          </div>
          <label className="month-picker">Select month
            <input className="form-control" type="month" value={month} onChange={(event) => setMonth(event.target.value)} />
          </label>
        </div>
        {children}
      </main>
      <footer className="container pb-4 text-center text-secondary small">Personal Expense Tracker · MERN Stack · Experiment 10</footer>
    </>
  );
}

function SummaryCards({ summary }) {
  const cards = [
    { title: 'Total income', value: summary.income, symbol: '↗', tone: 'income' },
    { title: 'Total expenses', value: summary.expenses, symbol: '↘', tone: 'expense' },
    { title: 'Remaining balance', value: summary.balance, symbol: '₹', tone: 'balance' },
    { title: 'Savings rate', value: `${Number(summary.savingsRate || 0).toFixed(1)}%`, symbol: '％', tone: 'savings', noMoney: true }
  ];
  return <div className="row g-3 mb-4">{cards.map((card) => (
    <div className="col-12 col-sm-6 col-xl-3" key={card.title}>
      <div className={`summary-card ${card.tone}`}>
        <div className="d-flex justify-content-between align-items-center mb-3"><span className="text-secondary small fw-semibold">{card.title}</span><span className="metric-icon">{card.symbol}</span></div>
        <div className="metric-value">{card.noMoney ? card.value : money(card.value)}</div>
      </div>
    </div>
  ))}</div>;
}

function CategoryBreakdown({ summary }) {
  const categoriesData = summary.categoryTotals || [];
  const max = Math.max(...categoriesData.map((item) => item.total), 1);
  if (!categoriesData.length) return <div className="empty-state py-4"><div className="empty-icon">◷</div><p className="mb-0">No expense categories for this month yet.</p></div>;
  return <div className="category-list">{categoriesData.map((item) => (
    <div className="category-row" key={item.category}>
      <div className="d-flex justify-content-between align-items-center gap-3 mb-2"><span className="fw-semibold">{item.category}</span><span className="fw-semibold">{money(item.total)}</span></div>
      <div className="progress" role="progressbar" aria-label={`${item.category} spending`} aria-valuenow={item.total} aria-valuemin="0" aria-valuemax={max}><div className="progress-bar" style={{ width: `${(item.total / max) * 100}%` }} /></div>
    </div>
  ))}</div>;
}

function TransactionTable({ transactions, onEdit, onDelete, compact = false }) {
  if (!transactions.length) return <div className="empty-state"><div className="empty-icon">＋</div><h3 className="h6 fw-bold">No transactions found</h3><p className="mb-0 text-secondary">Add a transaction or change your filters.</p></div>;
  const rows = compact ? transactions.slice(0, 5) : transactions;
  return <div className="table-responsive"><table className="table align-middle transaction-table mb-0">
    <thead><tr><th>Date</th><th>Transaction</th><th>Category</th><th className="text-end">Amount</th>{!compact && <th className="text-end">Actions</th>}</tr></thead>
    <tbody>{rows.map((item) => <tr key={item._id}>
      <td className="text-secondary text-nowrap">{prettyDate(item.date)}</td>
      <td><div className="fw-semibold">{item.description || item.category}</div><span className={`type-pill ${item.type}`}>{item.type}</span></td>
      <td><span className="category-chip">{item.category}</span></td>
      <td className={`text-end fw-bold text-nowrap ${item.type === 'income' ? 'amount-income' : 'amount-expense'}`}>{item.type === 'income' ? '+' : '−'}{money(item.amount)}</td>
      {!compact && <td><div className="d-flex justify-content-end gap-2"><button className="btn btn-sm btn-outline-secondary" onClick={() => onEdit(item)} type="button">Edit</button><button className="btn btn-sm btn-outline-danger" onClick={() => onDelete(item._id)} type="button">Delete</button></div></td>}
    </tr>)}</tbody>
  </table></div>;
}

function TransactionForm({ editing, onSave, onCancel, saving }) {
  const [form, setForm] = useState(initialForm);
  useEffect(() => {
    if (editing) {
      setForm({ type: editing.type, amount: String(editing.amount), category: editing.category, description: editing.description || '', date: new Date(editing.date).toISOString().slice(0, 10) });
    } else setForm({ ...initialForm, date: today });
  }, [editing]);
  const update = (event) => setForm((previous) => ({ ...previous, [event.target.name]: event.target.value }));
  const submit = async (event) => {
    event.preventDefault();
    const saved = await onSave({ ...form, amount: Number(form.amount) });
    if (!editing && saved) setForm({ ...initialForm, date: today });
  };
  return <form onSubmit={submit} className="form-panel">
    <div className="d-flex justify-content-between align-items-center mb-3"><h2 className="h5 fw-bold mb-0">{editing ? 'Edit transaction' : 'Add transaction'}</h2>{editing && <button type="button" className="btn btn-sm btn-link" onClick={onCancel}>Cancel edit</button>}</div>
    <div className="mb-3"><label className="form-label">Transaction type</label><div className="type-selector"><button type="button" className={`type-option ${form.type === 'expense' ? 'selected expense-option' : ''}`} onClick={() => setForm((p) => ({ ...p, type: 'expense', category: p.category === 'Salary' || p.category === 'Freelancing' || p.category === 'Investment' || p.category === 'Gift' ? 'Food' : p.category }))}>Expense</button><button type="button" className={`type-option ${form.type === 'income' ? 'selected income-option' : ''}`} onClick={() => setForm((p) => ({ ...p, type: 'income', category: ['Food', 'Travel', 'Shopping', 'Bills', 'Education', 'Health', 'Entertainment'].includes(p.category) ? 'Salary' : p.category }))}>Income</button></div></div>
    <div className="mb-3"><label className="form-label" htmlFor="amount">Amount (₹)</label><input className="form-control" id="amount" name="amount" type="number" min="0.01" step="0.01" value={form.amount} onChange={update} placeholder="e.g. 500" required /></div>
    <div className="mb-3"><label className="form-label" htmlFor="category">Category</label><select className="form-select" id="category" name="category" value={form.category} onChange={update} required>{categories.map((category) => <option key={category}>{category}</option>)}</select></div>
    <div className="mb-3"><label className="form-label" htmlFor="date">Date</label><input className="form-control" id="date" name="date" type="date" value={form.date} onChange={update} required /></div>
    <div className="mb-4"><label className="form-label" htmlFor="description">Description</label><input className="form-control" id="description" name="description" maxLength="120" value={form.description} onChange={update} placeholder="e.g. Lunch with friends" /></div>
    <button className="btn btn-primary w-100" type="submit" disabled={saving}>{saving ? 'Saving…' : editing ? 'Update transaction' : 'Save transaction'}</button>
  </form>;
}

function Dashboard({ summary, transactions }) {
  return <>
    <SummaryCards summary={summary} />
    <div className="row g-4">
      <div className="col-12 col-lg-5"><section className="content-panel h-100"><div className="panel-heading"><div><h2 className="h5 fw-bold mb-1">Spending by category</h2><p className="text-secondary small mb-0">Expense breakdown for the selected month</p></div><span className="panel-symbol">◒</span></div><CategoryBreakdown summary={summary} /></section></div>
      <div className="col-12 col-lg-7"><section className="content-panel h-100"><div className="panel-heading"><div><h2 className="h5 fw-bold mb-1">Recent transactions</h2><p className="text-secondary small mb-0">Your latest activity this month</p></div><Link className="small fw-semibold text-decoration-none" to="/transactions">View all →</Link></div><TransactionTable transactions={transactions} compact /></section></div>
    </div>
  </>;
}

function TransactionsPage({ transactions, onEdit, onDelete, editing, onSave, onCancel, saving, filters, setFilters, loading }) {
  const shown = useMemo(() => transactions.filter((item) => (filters.type === 'all' || item.type === filters.type) && (filters.category === 'all' || item.category === filters.category)), [transactions, filters]);
  return <div className="row g-4 align-items-start">
    <div className="col-12 col-lg-4"><TransactionForm key={editing?._id || 'new'} editing={editing} onSave={onSave} onCancel={onCancel} saving={saving} /></div>
    <div className="col-12 col-lg-8"><section className="content-panel"><div className="panel-heading"><div><h2 className="h5 fw-bold mb-1">Transaction history</h2><p className="text-secondary small mb-0">{shown.length} record(s) in selected month</p></div></div>
      <div className="row g-2 mb-3"><div className="col-6"><select className="form-select" aria-label="Filter by type" value={filters.type} onChange={(e) => setFilters((p) => ({ ...p, type: e.target.value }))}><option value="all">All types</option><option value="income">Income</option><option value="expense">Expenses</option></select></div><div className="col-6"><select className="form-select" aria-label="Filter by category" value={filters.category} onChange={(e) => setFilters((p) => ({ ...p, category: e.target.value }))}><option value="all">All categories</option>{categories.map((category) => <option key={category}>{category}</option>)}</select></div></div>
      {loading ? <p className="text-secondary py-4">Loading transactions…</p> : <TransactionTable transactions={shown} onEdit={onEdit} onDelete={onDelete} />}
    </section></div>
  </div>;
}

function ReportsPage({ summary }) {
  return <>
    <SummaryCards summary={summary} />
    <section className="content-panel"><div className="panel-heading"><div><h2 className="h5 fw-bold mb-1">Category-wise spending</h2><p className="text-secondary small mb-0">Highest spending categories are shown first.</p></div></div>
      <CategoryBreakdown summary={summary} />
      <div className="report-total mt-4"><span>Total expenses for {summary.month || currentMonth}</span><strong>{money(summary.expenses)}</strong></div>
      <div className="report-total"><span>Number of transactions</span><strong>{summary.transactionCount || 0}</strong></div>
      <div className="report-total"><span>Income minus expenses</span><strong className={summary.balance >= 0 ? 'amount-income' : 'amount-expense'}>{money(summary.balance)}</strong></div>
    </section>
  </>;
}


function AIAgentPage({ month, onDataChanged }) {
  const [messages, setMessages] = useState([{ role: 'assistant', text: 'Hi! I’m Pennywise, your financial companion. I can review your selected month, compare it with last month, identify your biggest spending categories, and suggest ways to save. What would you like to know?' }]);
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [mode, setMode] = useState('');
  const prompts = ['Where am I spending the most?', 'Compare this month with last month', 'How can I save money?', 'Help me create a budget'];
  const send = async (text = message) => {
    const question = text.trim();
    if (!question || busy) return;
    setMessages((old) => [...old, { role: 'user', text: question }]);
    setMessage(''); setBusy(true); setError('');
    try {
      const result = await request('/agent/chat', { method: 'POST', body: JSON.stringify({ message: question, month }) });
      setMessages((old) => [...old, { role: 'assistant', text: result.answer }]);
      setMode(result.mode === 'gemini' ? 'Gemini AI connected' : 'Built-in financial agent');
    } catch (err) { setError(err.message); }
    finally { setBusy(false); }
  };
  const getInsights = async () => {
    setBusy(true); setError('');
    try {
      const result = await request(`/agent/insights?month=${encodeURIComponent(month)}`);
      setMessages((old) => [...old, { role: 'assistant', text: `Monthly review for ${month}\n\n${result.insights}` }]);
      setMode('Monthly review');
    } catch (err) { setError(err.message); }
    finally { setBusy(false); }
  };
  const loadDemoData = async () => {
    setBusy(true); setError('');
    try {
      const result = await request(`/transactions/demo-data?month=${encodeURIComponent(month)}`, { method: 'POST' });
      await onDataChanged();
      setMessages((old) => [...old, {
        role: 'assistant',
        text: result.insertedCount
          ? `Added ${result.insertedCount} sample transactions across ${result.previousMonth} and ${result.month}. Ask me to compare these months whenever you're ready.`
          : `Sample transactions for ${result.previousMonth} and ${result.month} are already loaded, so I didn't add duplicates. Ask me to compare these months whenever you're ready.`
      }]);
      setMode('Two-month sample data');
    } catch (err) { setError(err.message); }
    finally { setBusy(false); }
  };
  return <div className="row g-4">
    <div className="col-12 col-lg-8">
      <section className="agent-panel">
        <div className="agent-hero"><div className="agent-avatar">✦</div><div className="flex-grow-1"><div className="d-flex flex-wrap align-items-center gap-2"><h2 className="h4 fw-bold mb-1">Talk to Pennywise</h2><span className="agent-live"><span /> Ready to help</span></div><p className="mb-0">Your personal finance agent · Analyses saved MongoDB transactions for {month}</p></div></div>
        <div className="agent-prompts"><span className="small fw-bold text-secondary me-1">TRY ASKING</span>{prompts.map((prompt) => <button key={prompt} type="button" className="prompt-chip" disabled={busy} onClick={() => send(prompt)}>{prompt}</button>)}</div>
        <div className="chat-messages" aria-live="polite">{messages.map((item, index) => <div key={index} className={`chat-row ${item.role}`}><div className="chat-avatar">{item.role === 'assistant' ? '✦' : 'You'}</div><div className="chat-bubble"><div className="chat-role">{item.role === 'assistant' ? 'Pennywise' : 'You'}</div><div className="chat-text">{item.text}</div></div></div>)}{busy && <div className="chat-row assistant"><div className="chat-avatar">✦</div><div className="chat-bubble"><div className="chat-role">Pennywise</div><div className="typing-dots">Reviewing your numbers…</div></div></div>}</div>
        {error && <div className="alert alert-danger mx-3 mb-0">{error}</div>}
        <form className="agent-composer" onSubmit={(event) => { event.preventDefault(); send(); }}><input value={message} onChange={(event) => setMessage(event.target.value)} maxLength={1000} placeholder="Ask about spending, savings, budgets…" aria-label="Ask the financial agent"/><button className="btn btn-primary" type="submit" disabled={busy || !message.trim()}>{busy ? 'Thinking…' : 'Send ↑'}</button></form>
        <div className="agent-footnote">{mode || 'Data-based answers'} · Uses your saved transaction data · Educational guidance, not financial advice</div>
      </section>
    </div>
    <div className="col-12 col-lg-4"><section className="content-panel agent-side"><div className="panel-heading"><div><h2 className="h5 fw-bold mb-1">Agent tools</h2><p className="text-secondary small mb-0">Run a quick review on your records.</p></div><span className="panel-symbol">✦</span></div>
      <button type="button" className="agent-tool" onClick={getInsights} disabled={busy}><span className="tool-icon">◷</span><span><strong>Monthly financial review</strong><small>Income, expenses and category patterns</small></span><span>→</span></button>
      <button type="button" className="agent-tool" onClick={() => send('Compare this month with last month and explain what changed.')} disabled={busy}><span className="tool-icon">↗</span><span><strong>Month-on-month comparison</strong><small>Spot increases and decreases</small></span><span>→</span></button>
      <button type="button" className="agent-tool" onClick={() => send('Help me create a realistic budget based on my transactions.')} disabled={busy}><span className="tool-icon">◎</span><span><strong>Budget coach</strong><small>Practical spending limits to try</small></span><span>→</span></button>
      <button type="button" className="agent-tool" onClick={loadDemoData} disabled={busy}><span className="tool-icon">＋</span><span><strong>Add two-month sample data</strong><small>Adds examples for {month} and the previous month</small></span><span>→</span></button>
      <p className="small text-secondary mb-0">Sample entries are clearly labelled and won't replace your existing transactions.</p>
      <div className="agent-privacy mt-3"><strong>How it works</strong><p className="small mb-0 mt-1">The server reads transaction summaries from MongoDB. Add a Gemini API key to enable generated conversational answers; without one, the built-in agent still provides data-based guidance.</p></div>
    </section></div>
  </div>;
}

function AuthPage({ mode = 'login', onAuthenticated }) {
  const isRegister = mode === 'register';
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const submit = async (event) => {
    event.preventDefault();
    setError('');
    setBusy(true);
    try {
      const result = await request(`/auth/${isRegister ? 'register' : 'login'}`, {
        method: 'POST',
        body: JSON.stringify({ ...(isRegister ? { name } : {}), email, password })
      });
      localStorage.setItem(AUTH_TOKEN_KEY, result.token);
      onAuthenticated(result.user);
      navigate('/', { replace: true });
    } catch (err) {
      setError(err.message || 'Unable to authenticate. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="auth-screen">
      <div className="auth-ambient auth-ambient-one" />
      <div className="auth-ambient auth-ambient-two" />
      <section className="auth-card">
        <div className="auth-brand-mark">₹</div>
        <p className="eyebrow text-center mb-2">PERSONAL FINANCE, MADE CLEAR</p>
        <h1 className="auth-title">{isRegister ? 'Create your account' : 'Welcome back'}</h1>
        <p className="auth-subtitle">{isRegister ? 'Start organising your money in one simple place.' : 'Sign in to continue to your PennyTrack dashboard.'}</p>

        {error && <div className="alert alert-danger py-2" role="alert">{error}</div>}
        <form onSubmit={submit}>
          {isRegister && <div className="mb-3">
            <label className="form-label" htmlFor="auth-name">Full name</label>
            <input id="auth-name" className="form-control" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" minLength={2} maxLength={60} required />
          </div>}
          <div className="mb-3">
            <label className="form-label" htmlFor="auth-email">Email address</label>
            <input id="auth-email" className="form-control" type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" maxLength={254} placeholder="you@example.com" required />
          </div>
          <div className="mb-3">
            <label className="form-label" htmlFor="auth-password">Password</label>
            <div className="auth-password-wrap">
              <input id="auth-password" className="form-control" type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} autoComplete={isRegister ? 'new-password' : 'current-password'} minLength={isRegister ? 8 : undefined} maxLength={128} placeholder={isRegister ? 'At least 8 characters' : 'Enter your password'} required />
              <button type="button" className="auth-show-password" onClick={() => setShowPassword((value) => !value)} aria-label={showPassword ? 'Hide password' : 'Show password'}>{showPassword ? 'Hide' : 'Show'}</button>
            </div>
            {isRegister && <div className="form-text">Use at least 8 characters.</div>}
          </div>
          <button className="btn btn-primary auth-submit w-100" type="submit" disabled={busy}>
            {busy ? 'Please wait…' : isRegister ? 'Create account' : 'Log in'}
          </button>
        </form>
        <div className="auth-switch">
          {isRegister ? 'Already have an account?' : 'New to PennyTrack?'}{' '}
          <Link to={isRegister ? '/login' : '/register'}>{isRegister ? 'Log in' : 'Create an account'}</Link>
        </div>
        <div className="auth-security"><span>✓</span> Your transactions are private to your account.</div>
      </section>
      <p className="auth-footer">PennyTrack · Personal Expense Tracker</p>
    </main>
  );
}

export default function App() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [month, setMonth] = useState(currentMonth);
  const [transactions, setTransactions] = useState([]);
  const [summary, setSummary] = useState({ income: 0, expenses: 0, balance: 0, savingsRate: 0, transactionCount: 0, categoryTotals: [], month: currentMonth });
  const [editing, setEditing] = useState(null);
  const [filters, setFilters] = useState({ type: 'all', category: 'all' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  useEffect(() => {
    let active = true;
    const token = localStorage.getItem(AUTH_TOKEN_KEY);
    if (!token) {
      setAuthLoading(false);
      return () => { active = false; };
    }
    request('/auth/me')
      .then((result) => { if (active) setUser(result.user); })
      .catch(() => {
        localStorage.removeItem(AUTH_TOKEN_KEY);
        if (active) setUser(null);
      })
      .finally(() => { if (active) setAuthLoading(false); });
    return () => { active = false; };
  }, []);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [transactionData, summaryData] = await Promise.all([
        request(`/transactions?month=${encodeURIComponent(month)}`),
        request(`/summary?month=${encodeURIComponent(month)}`)
      ]);
      setTransactions(transactionData);
      setSummary(summaryData);
    } catch (err) {
      setError(`${err.message} Make sure MongoDB and the backend server are running.`);
    } finally {
      setLoading(false);
    }
  }, [month]);

  useEffect(() => { if (user) loadData(); }, [loadData, user]);

  const saveTransaction = async (form) => {
    setSaving(true); setError(''); setNotice('');
    try {
      if (editing) await request(`/transactions/${editing._id}`, { method: 'PUT', body: JSON.stringify(form) });
      else await request('/transactions', { method: 'POST', body: JSON.stringify(form) });
      setEditing(null);
      setNotice(editing ? 'Transaction updated.' : 'Transaction saved.');
      await loadData();
      return true;
    } catch (err) { setError(err.message); return false; }
    finally { setSaving(false); }
  };

  const deleteTransaction = async (id) => {
    if (!window.confirm('Delete this transaction?')) return;
    setError(''); setNotice('');
    try {
      await request(`/transactions/${id}`, { method: 'DELETE' });
      if (editing?._id === id) setEditing(null);
      setNotice('Transaction deleted.');
      await loadData();
    } catch (err) { setError(err.message); }
  };

  const handleLogout = () => {
    localStorage.removeItem(AUTH_TOKEN_KEY);
    setUser(null);
    setTransactions([]);
    setSummary({ income: 0, expenses: 0, balance: 0, savingsRate: 0, transactionCount: 0, categoryTotals: [], month: currentMonth });
    setEditing(null);
    setError('');
    setNotice('');
    navigate('/login', { replace: true });
  };

  if (authLoading) {
    return <main className="auth-screen"><div className="auth-loading"><div className="spinner-border text-success" role="status" /><p className="mb-0 mt-3">Checking your session…</p></div></main>;
  }

  if (!user) {
    return <Routes>
      <Route path="/register" element={<AuthPage mode="register" onAuthenticated={setUser} />} />
      <Route path="*" element={<AuthPage mode="login" onAuthenticated={setUser} />} />
    </Routes>;
  }

  return <Layout month={month} setMonth={setMonth} user={user} onLogout={handleLogout}>
    {error && <div className="alert alert-danger" role="alert">{error}</div>}
    {notice && <div className="alert alert-success alert-dismissible" role="status">{notice}<button type="button" className="btn-close" aria-label="Close" onClick={() => setNotice('')} /></div>}
    <Routes>
      <Route path="/login" element={<Navigate to="/" replace />} />
      <Route path="/register" element={<Navigate to="/" replace />} />
      <Route path="/" element={loading ? <div className="content-panel">Loading dashboard…</div> : <Dashboard summary={summary} transactions={transactions} />} />
      <Route path="/transactions" element={<TransactionsPage transactions={transactions} onEdit={setEditing} onDelete={deleteTransaction} editing={editing} onSave={saveTransaction} onCancel={() => setEditing(null)} saving={saving} filters={filters} setFilters={setFilters} loading={loading} />} />
      <Route path="/reports" element={loading ? <div className="content-panel">Loading report…</div> : <ReportsPage summary={summary} />} />
      <Route path="/agent" element={<AIAgentPage month={month} onDataChanged={loadData} />} />
      <Route path="*" element={<div className="content-panel"><h2 className="h5">Page not found</h2><Link to="/">Return to dashboard</Link></div>} />
    </Routes>
  </Layout>;
}
