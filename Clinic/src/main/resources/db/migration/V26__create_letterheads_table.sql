CREATE TABLE letterheads (
    id BIGSERIAL PRIMARY KEY,
    doctor_id BIGINT NOT NULL REFERENCES doctors(id),
    clinic_name VARCHAR(255),
    clinic_address TEXT,
    clinic_phone VARCHAR(20),
    clinic_email VARCHAR(255),
    clinic_logo_path TEXT,
    letterhead_design_path TEXT,
    signature_path TEXT,
    gst_number VARCHAR(50),
    registration_number VARCHAR(100),
    use_system_generated BOOLEAN NOT NULL DEFAULT false,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_doctor_letterhead UNIQUE (doctor_id)
);

CREATE INDEX idx_letterheads_doctor ON letterheads(doctor_id);
