ALTER TABLE patients ADD COLUMN IF NOT EXISTS assigned_doctor_id BIGINT REFERENCES doctors(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_patients_assigned_doctor ON patients (assigned_doctor_id);
