CREATE TABLE patients (
    id              BIGSERIAL PRIMARY KEY,
    name            VARCHAR(150)   NOT NULL,
    phone           VARCHAR(20)    NOT NULL,
    email           VARCHAR(100),
    age             INTEGER,
    gender          VARCHAR(10),
    address         TEXT,
    blood_group     VARCHAR(5),
    medical_history TEXT,
    allergies       TEXT,
    emergency_contact_name   VARCHAR(150),
    emergency_contact_phone  VARCHAR(20),
    created_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_patients_name ON patients (name);
CREATE INDEX idx_patients_phone ON patients (phone);
