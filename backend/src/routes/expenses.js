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

// GET /api/expenses
router.get('/', async (req, res) => {
    const { category_id, start_date, end_date } = req.query;

    try {
        const userId = await requireUserId(req, res);
        if (!userId) return;

        let query = `
            SELECT e.*, c.name as category_name, c.color as category_color
            FROM expenses e
            LEFT JOIN categories c ON e.category_id = c.id
            WHERE e.user_id = $1
        `;
        const params = [userId];
        let idx = 2;

        if (category_id) {
            query += ` AND e.category_id = $${idx++}`;
            params.push(category_id);
        }
        if (start_date) {
            query += ` AND e.expense_date >= $${idx++}`;
            params.push(start_date);
        }
        if (end_date) {
            query += ` AND e.expense_date <= $${idx++}`;
            params.push(end_date);
        }

        query += ' ORDER BY e.expense_date DESC, e.created_at DESC';

        const result = await pool.query(query, params);
        res.json(result.rows);
    } catch (err) {
        console.error('Get expenses error:', err);
        res.status(500).json({ error: 'Failed to get expenses' });
    }
});

// GET /api/expenses/:id
router.get('/:id', async (req, res) => {
    try {
        const userId = await requireUserId(req, res);
        if (!userId) return;

        const result = await pool.query(
            `SELECT e.*, c.name as category_name, c.color as category_color
             FROM expenses e
             LEFT JOIN categories c ON e.category_id = c.id
             WHERE e.id = $1 AND e.user_id = $2`,
            [req.params.id, userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Expense not found' });
        }

        res.json(result.rows[0]);
    } catch (err) {
        console.error('Get expense error:', err);
        res.status(500).json({ error: 'Failed to get expense' });
    }
});

// POST /api/expenses
router.post('/', async (req, res) => {
    const { title, amount, currency, category_id, expense_date, notes } = req.body;

    if (!title || !amount) {
        return res.status(400).json({ error: 'title and amount are required' });
    }

    try {
        const userId = await requireUserId(req, res);
        if (!userId) return;

        const result = await pool.query(
            `INSERT INTO expenses
                (user_id, title, amount, currency, category_id, expense_date, notes)
             VALUES ($1, $2, $3, $4, $5, $6, $7)
             RETURNING *`,
            [
                userId,
                title,
                amount,
                currency || 'MYR',
                category_id || null,
                expense_date || new Date().toISOString().split('T')[0],
                notes || null,
            ]
        );

        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error('Create expense error:', err);
        res.status(500).json({ error: 'Failed to create expense' });
    }
});

// PATCH /api/expenses/:id
router.patch('/:id', async (req, res) => {
    const { title, amount, currency, category_id, expense_date, notes, s3_receipt_key } = req.body;

    try {
        const userId = await requireUserId(req, res);
        if (!userId) return;

        const existing = await pool.query(
            'SELECT id FROM expenses WHERE id = $1 AND user_id = $2',
            [req.params.id, userId]
        );
        if (existing.rows.length === 0) {
            return res.status(404).json({ error: 'Expense not found' });
        }

        const result = await pool.query(
            `UPDATE expenses SET
                title          = COALESCE($1, title),
                amount         = COALESCE($2, amount),
                currency       = COALESCE($3, currency),
                category_id    = COALESCE($4, category_id),
                expense_date   = COALESCE($5, expense_date),
                notes          = COALESCE($6, notes),
                s3_receipt_key = COALESCE($7, s3_receipt_key)
             WHERE id = $8
             RETURNING *`,
            [title, amount, currency, category_id, expense_date, notes, s3_receipt_key, req.params.id]
        );

        res.json(result.rows[0]);
    } catch (err) {
        console.error('Update expense error:', err);
        res.status(500).json({ error: 'Failed to update expense' });
    }
});

// DELETE /api/expenses/:id
router.delete('/:id', async (req, res) => {
    try {
        const userId = await requireUserId(req, res);
        if (!userId) return;

        const result = await pool.query(
            'DELETE FROM expenses WHERE id = $1 AND user_id = $2 RETURNING id',
            [req.params.id, userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Expense not found' });
        }

        res.status(204).send();
    } catch (err) {
        console.error('Delete expense error:', err);
        res.status(500).json({ error: 'Failed to delete expense' });
    }
});

// POST /api/expenses/:id/receipt-upload-url
router.post('/:id/receipt-upload-url', async (req, res) => {
    const { contentType = 'image/jpeg' } = req.body;

    try {
        const { getUploadUrl } = await import('../services/s3.js');
        const key = `receipts/${req.params.id}/receipt-${Date.now()}.jpg`;
        const uploadUrl = await getUploadUrl(key, contentType);
        res.json({ uploadUrl, key });
    } catch (err) {
        console.error('Upload URL error:', err);
        res.status(500).json({ error: 'Failed to generate upload URL' });
    }
});

export default router;
