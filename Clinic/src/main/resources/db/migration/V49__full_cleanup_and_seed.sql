-- V49: Clear data and seed fresh records
-- Step 1: Disable FK checks temporarily
SET session_replication_role = 'replica';

-- Step 2: Clear all tables (only those that exist)
DO $$
DECLARE
    tbl TEXT;
BEGIN
    FOR tbl IN SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename NOT IN ('flyway_schema_history')
    LOOP
        EXECUTE 'DELETE FROM ' || tbl;
    END LOOP;
END $$;

-- Step 3: Re-enable FK checks
SET session_replication_role = 'origin';

-- Step 4: Seed data (only if users table is empty)
INSERT INTO users (name, username, email, password, role, phone, created_at)
SELECT 'Clinic Admin', 'admin@gmail.com', 'admin@gmail.com', 'admin123', 'CLINIC_ADMIN', '9876543210', CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM users);

INSERT INTO users (name, username, email, password, role, phone, created_at)
SELECT 'Dr. Tamanna Oza', 'drtamanna@gmail.com', 'drtamanna@gmail.com', 'Dr@Tamanna', 'DOCTOR', '9876543212', CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM users WHERE role = 'DOCTOR');

INSERT INTO users (name, username, email, password, role, phone, created_at)
SELECT 'Patient Dhyey', 'padhyey@gmail.com', 'padhyey@gmail.com', 'Pa@Dhyey', 'PATIENT', '9876543217', CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM users WHERE role = 'PATIENT');

INSERT INTO users (name, username, email, password, role, phone, created_at)
SELECT 'Super Admin', 'superadmin@gmail.com', 'superadmin@gmail.com', 'super123', 'SUPER_ADMIN', '9876543211', CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM users WHERE username = 'superadmin@gmail.com');

INSERT INTO users (name, username, email, password, role, phone, created_at)
SELECT 'Receptionist Rahul', 'receptionist@gmail.com', 'receptionist@gmail.com', 'reception123', 'RECEPTIONIST', '9876543216', CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM users WHERE role = 'RECEPTIONIST');
