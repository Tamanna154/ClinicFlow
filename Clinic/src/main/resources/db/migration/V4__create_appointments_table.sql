CREATE TABLE appointments (
    id              BIGSERIAL PRIMARY KEY,
    doctor_id       BIGINT         NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
    patient_id      BIGINT         NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    appointment_date DATE          NOT NULL,
    start_time      TIME           NOT NULL,
    end_time        TIME           NOT NULL,
    status          VARCHAR(20)    NOT NULL DEFAULT 'SCHEDULED',
    reason          TEXT,
    notes           TEXT,
    google_event_id VARCHAR(255),
    created_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_valid_appointment_time CHECK (start_time < end_time),
    CONSTRAINT chk_appointment_status CHECK (
        status IN ('SCHEDULED', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'NO_SHOW')
    )
);

CREATE INDEX idx_appointments_doctor ON appointments (doctor_id);
CREATE INDEX idx_appointments_patient ON appointments (patient_id);
CREATE INDEX idx_appointments_date ON appointments (appointment_date);
CREATE INDEX idx_appointments_status ON appointments (status);
CREATE INDEX idx_appointments_doctor_date ON appointments (doctor_id, appointment_date);
