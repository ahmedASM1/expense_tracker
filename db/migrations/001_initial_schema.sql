-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Users table
CREATE TABLE users (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cognito_sub     VARCHAR(128) UNIQUE NOT NULL,
    full_name       VARCHAR(255) NOT NULL,
    email           VARCHAR(255) UNIQUE NOT NULL,
    role            TEXT NOT NULL DEFAULT 'user'
                        CHECK (role IN ('user', 'admin')),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Categories table
CREATE TABLE categories (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name            VARCHAR(100) NOT NULL,
    color           VARCHAR(7) NOT NULL DEFAULT '#6366f1',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Expenses table
CREATE TABLE expenses (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    category_id     UUID REFERENCES categories(id) ON DELETE SET NULL,
    title           VARCHAR(255) NOT NULL,
    amount          NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
    currency        VARCHAR(10) NOT NULL DEFAULT 'MYR',
    expense_date    DATE NOT NULL DEFAULT CURRENT_DATE,
    s3_receipt_key  TEXT,
    notes           TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Budgets table
CREATE TABLE budgets (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id          UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    category_id      UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
    month            SMALLINT NOT NULL CHECK (month BETWEEN 1 AND 12),
    year             SMALLINT NOT NULL CHECK (year BETWEEN 2000 AND 2100),
    allocated_amount NUMERIC(12, 2) NOT NULL CHECK (allocated_amount > 0),
    created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_budget UNIQUE (user_id, category_id, month, year)
);

-- Notifications table
CREATE TABLE notifications (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type        TEXT NOT NULL DEFAULT 'receipt_uploaded'
                    CHECK (type IN ('receipt_uploaded', 'budget_exceeded', 'monthly_summary')),
    message     TEXT NOT NULL,
    is_read     BOOLEAN NOT NULL DEFAULT FALSE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for faster queries
CREATE INDEX idx_expenses_user      ON expenses(user_id);
CREATE INDEX idx_expenses_category  ON expenses(category_id);
CREATE INDEX idx_expenses_date      ON expenses(expense_date);
CREATE INDEX idx_categories_user    ON categories(user_id);
CREATE INDEX idx_budgets_user       ON budgets(user_id);
CREATE INDEX idx_notifications_user ON notifications(user_id);

-- Seed data for local dev (one user per role)
INSERT INTO users (cognito_sub, full_name, email, role) VALUES
    ('local-user-sub',  'Test User',  'user@dev.local',  'user'),
    ('local-admin-sub', 'Test Admin', 'admin@dev.local', 'admin');