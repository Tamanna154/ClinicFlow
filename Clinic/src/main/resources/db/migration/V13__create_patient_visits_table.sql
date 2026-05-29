CREATE TABLE IF NOT EXISTS patient_visits (
    id BIGSERIAL PRIMARY KEY,
    patient_id BIGINT NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    doctor_id BIGINT REFERENCES doctors(id) ON DELETE SET NULL,
    appointment_id BIGINT REFERENCES appointments(id) ON DELETE SET NULL,
    visit_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    diagnosis TEXT,
    prescription TEXT,
    additional_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_patient_visits_patient ON patient_visits (patient_id);
