-- Add PATIENT role to users table
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (role IN ('DOCTOR', 'RECEPTIONIST', 'PATIENT'));

-- Add patient_id column for patient users
ALTER TABLE users ADD COLUMN IF NOT EXISTS patient_id BIGINT;

-- Hash existing plaintext passwords using pgcrypto bcrypt
CREATE EXTENSION IF NOT EXISTS pgcrypto;
UPDATE users SET password = crypt(password, gen_salt('bf'));
