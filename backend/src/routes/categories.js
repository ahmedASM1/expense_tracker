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

// GET /api/categories
router.get('/', async (req, res) => {
    try {
        const userId = await requireUserId(req, res);
        if (!userId) return;

        const result = await pool.query(
            'SELECT * FROM categories WHERE user_id = $1 ORDER BY name ASC',
            [userId]
        );
        res.json(result.rows);
    } catch (err) {
        console.error('Get categories error:', err);
        res.status(500).json({ error: 'Failed to get categories' });
    }
});

// POST /api/categories
router.post('/', async (req, res) => {
    const { name, color } = req.body;
    if (!name) return res.status(400).json({ error: 'name is required' });

    try {
        const userId = await requireUserId(req, res);
        if (!userId) return;

        const result = await pool.query(
            `INSERT INTO categories (user_id, name, color)
             VALUES ($1, $2, $3) RETURNING *`,
            [userId, name, color || '#6366f1']
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error('Create category error:', err);
        res.status(500).json({ error: 'Failed to create category' });
    }
});

// PATCH /api/categories/:id
router.patch('/:id', async (req, res) => {
    const { name, color } = req.body;

    try {
        const userId = await requireUserId(req, res);
        if (!userId) return;

        const result = await pool.query(
            `UPDATE categories SET
                name  = COALESCE($1, name),
                color = COALESCE($2, color)
             WHERE id = $3 AND user_id = $4
             RETURNING *`,
            [name, color, req.params.id, userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Category not found' });
        }
        res.json(result.rows[0]);
    } catch (err) {
        console.error('Update category error:', err);
        res.status(500).json({ error: 'Failed to update category' });
    }
});

// DELETE /api/categories/:id
router.delete('/:id', async (req, res) => {
    try {
        const userId = await requireUserId(req, res);
        if (!userId) return;

        const result = await pool.query(
            'DELETE FROM categories WHERE id = $1 AND user_id = $2 RETURNING id',
            [req.params.id, userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Category not found' });
        }
        res.status(204).send();
    } catch (err) {
        console.error('Delete category error:', err);
        res.status(500).json({ error: 'Failed to delete category' });
    }
});

export default router;
