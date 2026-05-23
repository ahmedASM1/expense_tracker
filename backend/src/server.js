import express from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import 'dotenv/config';

import healthRouter     from './routes/health.js';
import authRouter       from './routes/auth.js';
import expensesRouter   from './routes/expenses.js';
import categoriesRouter from './routes/categories.js';
import budgetsRouter    from './routes/budgets.js';

const app  = express();
const PORT = process.env.PORT || 8080;

// ── Middleware ────────────────────────────────────────────────
app.use(cors({
    origin: [
        'http://localhost:3000',
        process.env.FRONTEND_URL,
    ].filter(Boolean),
    credentials: true,
}));

app.use(express.json());
app.use(cookieParser());

// ── Routes ────────────────────────────────────────────────────
app.use('/api/health',     healthRouter);
app.use('/api/auth',       authRouter);
app.use('/api/expenses',   expensesRouter);
app.use('/api/categories', categoriesRouter);
app.use('/api/budgets',    budgetsRouter);

// ── Global error handler ──────────────────────────────────────
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});