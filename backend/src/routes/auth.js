import { Router } from 'express';
import pool from '../db/pool.js';
import { requireAuth } from '../middleware/auth.js';


const router = Router();

// POST /api/auth/register
// Called after Cognito sign-up to save the user in our database
router.post('/register', async (req, res) => {
    const { cognitoSub, fullName, email } = req.body;

    if (!cognitoSub || !fullName || !email) {
        return res.status(400).json({ error: 'cognitoSub, fullName and email are required' });
    }

    try {
        const existing = await pool.query(
            'SELECT id FROM users WHERE cognito_sub = $1',
            [cognitoSub]
        );

        if (existing.rows.length > 0) {
            return res.status(409).json({ error: 'User already exists' });
        }

        const result = await pool.query(
            `INSERT INTO users (cognito_sub, full_name, email)
             VALUES ($1, $2, $3)
             RETURNING id, full_name, email, role, created_at`,
            [cognitoSub, fullName, email]
        );

        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error('Register error:', err);
        res.status(500).json({ error: 'Failed to register user' });
    }
});

// GET /api/auth/me
// Returns the current logged-in user from the database
router.get('/me', requireAuth, async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT id, full_name, email, role, created_at
             FROM users
             WHERE cognito_sub = $1`,
            [req.user.sub]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json(result.rows[0]);
    } catch (err) {
        console.error('Me error:', err);
        res.status(500).json({ error: 'Failed to get user' });
    }
});

// PATCH /api/auth/me
router.patch('/me', requireAuth, async (req, res) => {
    const { full_name, email } = req.body;

    if (!full_name?.trim() && !email?.trim()) {
        return res.status(400).json({ error: 'full_name or email is required' });
    }

    try {
        const result = await pool.query(
            `UPDATE users SET
                full_name = COALESCE($1, full_name),
                email     = COALESCE($2, email)
             WHERE cognito_sub = $3
             RETURNING id, full_name, email, role, created_at`,
            [full_name?.trim() || null, email?.trim() || null, req.user.sub]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json(result.rows[0]);
    } catch (err) {
        if (err.code === '23505') {
            return res.status(409).json({ error: 'Email already in use' });
        }
        console.error('Update me error:', err);
        res.status(500).json({ error: 'Failed to update profile' });
    }
});

export default router;
