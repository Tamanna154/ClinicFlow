CREATE TABLE staff_details (
    id                BIGSERIAL PRIMARY KEY,
    doctor_staff_id   BIGINT NOT NULL REFERENCES doctor_staff(id) ON DELETE CASCADE,
    full_name         VARCHAR(150) NOT NULL,
    phone             VARCHAR(20),
    age               INTEGER,
    email             VARCHAR(100),
    address           TEXT,
    role_title        VARCHAR(50) NOT NULL DEFAULT 'RECEPTIONIST',
    aadhar_number     VARCHAR(20),
    pan_number        VARCHAR(20),
    bank_account_no   VARCHAR(30),
    bank_name         VARCHAR(100),
    ifsc_code         VARCHAR(20),
    emergency_contact VARCHAR(20),
    notes             TEXT,
    is_active         BOOLEAN NOT NULL DEFAULT TRUE,
    created_at        TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at        TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    UNIQUE (doctor_staff_id)
);

CREATE INDEX idx_staff_details_active ON staff_details (is_active);
