-- Update the CHECK constraint on appointments.status to include PATIENT_ARRIVED and CONSULTATION_COMPLETED
-- which are valid workflow states used by the application but were missing from the original V4 migration.

ALTER TABLE appointments DROP CONSTRAINT IF EXISTS chk_appointment_status;

ALTER TABLE appointments ADD CONSTRAINT chk_appointment_status CHECK (
    status IN ('SCHEDULED', 'CONFIRMED', 'PATIENT_ARRIVED', 'IN_PROGRESS', 'CONSULTATION_COMPLETED', 'COMPLETED', 'CANCELLED', 'NO_SHOW')
);
