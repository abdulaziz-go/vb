-- Create documents table
CREATE TABLE IF NOT EXISTS documents (
    id UUID PRIMARY KEY,
    filename TEXT,
    status TEXT DEFAULT 'active',
    signed_by TEXT,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
    signed_at TIMESTAMP WITHOUT TIME ZONE,
    qr_token TEXT,
    file_hash TEXT
);

-- Create admins table
CREATE TABLE IF NOT EXISTS admins (
    id SERIAL PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL
);

-- Insert a default admin user (username: admin, password: admin123)
-- Password hash for 'admin123' (bcrypt)
INSERT INTO admins (username, password_hash)
VALUES ('admin', '$2b$10$w8.BvD/Jg.fO6G7X6v/pOu0V6YpJkI6S8O9U9n1n.w2WvG9U1n1n')
ON CONFLICT (username) DO NOTHING;
