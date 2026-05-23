import { Router } from 'express';
import pool from '../db/pool.js';

const router = Router();

router.get('/', async (req, res) => {
    try {
        await pool.query('SELECT 1');
        res.json({
            status:      'ok',
            environment: process.env.NODE_ENV || 'development',
            database:    'connected',
            timestamp:   new Date().toISOString(),
        });
    } catch (err) {
        res.status(500).json({
            status:   'error',
            database: 'disconnected',
            message:  err.message,
        });
    }
});

export default router;