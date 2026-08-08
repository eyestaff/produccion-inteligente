-- Migration 0009: Secure admin password change flow
-- Adds must_change_password flag to users table.
-- When set to 1, the login response includes this flag and the frontend
-- redirects the user to /change-password before accessing the dashboard.

ALTER TABLE users ADD COLUMN must_change_password INTEGER NOT NULL DEFAULT 0;
