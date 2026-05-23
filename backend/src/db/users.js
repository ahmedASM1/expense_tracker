import pool from './pool.js';

/**
 * Resolve the app user id for the authenticated request.
 * Creates a users row on first Cognito login if one does not exist yet.
 */
export async function getUserIdForRequest(req) {
    const sub = req.user?.sub;
    if (!sub) return null;

    const existing = await pool.query(
        'SELECT id FROM users WHERE cognito_sub = $1',
        [sub]
    );
    if (existing.rows.length > 0) {
        return existing.rows[0].id;
    }

    const email =
        req.user.email ||
        req.user['cognito:username'] ||
        `${sub}@users.local`;
    const fullName =
        req.user.name ||
        req.user.given_name ||
        email.split('@')[0] ||
        'User';

    const created = await pool.query(
        `INSERT INTO users (cognito_sub, full_name, email)
         VALUES ($1, $2, $3)
         ON CONFLICT (cognito_sub) DO UPDATE SET cognito_sub = EXCLUDED.cognito_sub
         RETURNING id`,
        [sub, fullName, email]
    );

    return created.rows[0]?.id ?? null;
}
