CREATE TABLE consultations (
    id BIGSERIAL PRIMARY KEY,
    appointment_id BIGINT NOT NULL REFERENCES appointments(id) ON DELETE CASCADE,
    patient_id BIGINT NOT NULL,
    doctor_id BIGINT NOT NULL,
    symptoms TEXT,
    diagnosis TEXT,
    doctor_notes TEXT,
    blood_pressure VARCHAR(20),
    pulse_rate INTEGER,
    weight DECIMAL(5,2),
    height DECIMAL(5,2),
    temperature DECIMAL(4,1),
    oxygen_level DECIMAL(4,1),
    follow_up_date DATE,
    follow_up_notes TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'IN_PROGRESS',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_consultations_appointment ON consultations(appointment_id);
CREATE INDEX idx_consultations_patient ON consultations(patient_id);
CREATE INDEX idx_consultations_doctor ON consultations(doctor_id);
