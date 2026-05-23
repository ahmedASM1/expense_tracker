import { Router } from 'express';
import pool from '../db/pool.js';
import { getUserIdForRequest } from '../db/users.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.use(requireAuth);

async function requireUserId(req, res) {
    const userId = await getUserIdForRequest(req);
    if (!userId) {
        res.status(401).json({ error: 'User not found' });
        return null;
    }
    return userId;
}

// GET /api/budgets?month=5&year=2026
router.get('/', async (req, res) => {
    const { month, year } = req.query;

    try {
        const userId = await requireUserId(req, res);
        if (!userId) return;

        let query = `
            SELECT b.*, c.name as category_name, c.color as category_color,
                COALESCE(SUM(e.amount), 0) as spent
            FROM budgets b
            JOIN categories c ON b.category_id = c.id
            LEFT JOIN expenses e
                ON e.category_id = b.category_id
                AND e.user_id = b.user_id
                AND EXTRACT(MONTH FROM e.expense_date) = b.month
                AND EXTRACT(YEAR  FROM e.expense_date) = b.year
            WHERE b.user_id = $1
        `;
        const params = [userId];
        let idx = 2;

        if (month) { query += ` AND b.month = $${idx++}`; params.push(month); }
        if (year)  { query += ` AND b.year  = $${idx++}`; params.push(year); }

        query += ' GROUP BY b.id, c.name, c.color ORDER BY c.name ASC';

        const result = await pool.query(query, params);
        res.json(result.rows);
    } catch (err) {
        console.error('Get budgets error:', err);
        res.status(500).json({ error: 'Failed to get budgets' });
    }
});

// PUT /api/budgets
router.put('/', async (req, res) => {
    const { category_id, month, year, allocated_amount } = req.body;

    if (!category_id || !month || !year || !allocated_amount) {
        return res.status(400).json({ error: 'category_id, month, year and allocated_amount are required' });
    }

    try {
        const userId = await requireUserId(req, res);
        if (!userId) return;

        const result = await pool.query(
            `INSERT INTO budgets (user_id, category_id, month, year, allocated_amount)
             VALUES ($1, $2, $3, $4, $5)
             ON CONFLICT (user_id, category_id, month, year)
             DO UPDATE SET allocated_amount = EXCLUDED.allocated_amount
             RETURNING *`,
            [userId, category_id, month, year, allocated_amount]
        );

        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error('Upsert budget error:', err);
        res.status(500).json({ error: 'Failed to save budget' });
    }
});

// DELETE /api/budgets/:id
router.delete('/:id', async (req, res) => {
    try {
        const userId = await requireUserId(req, res);
        if (!userId) return;

        const result = await pool.query(
            'DELETE FROM budgets WHERE id = $1 AND user_id = $2 RETURNING id',
            [req.params.id, userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Budget not found' });
        }
        res.status(204).send();
    } catch (err) {
        console.error('Delete budget error:', err);
        res.status(500).json({ error: 'Failed to delete budget' });
    }
});

export default router;
