-- =============================================================================
-- DAU Examination System - Database Initialization
-- =============================================================================
-- This script runs on first container start when the database is created.
-- Prisma handles schema migrations, but we set up extensions and defaults here.
-- =============================================================================

-- Enable required PostgreSQL extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Set timezone
SET timezone = 'Asia/Ho_Chi_Minh';

-- Grant privileges (if using a separate app user in production)
-- CREATE USER app_user WITH PASSWORD 'secure_password';
-- GRANT ALL PRIVILEGES ON DATABASE dau_exam TO app_user;

-- Log initialization
DO $$
BEGIN
    RAISE NOTICE 'DAU Examination System database initialized successfully';
    RAISE NOTICE 'Timestamp: %', NOW();
END $$;
