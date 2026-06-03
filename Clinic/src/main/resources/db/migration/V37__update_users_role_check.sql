-- Update role check constraint to include new admin roles
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE users ADD CONSTRAINT users_role_check 
    CHECK (role IN ('DOCTOR', 'RECEPTIONIST', 'PATIENT', 'CLINIC_ADMIN', 'SUPER_ADMIN'));
