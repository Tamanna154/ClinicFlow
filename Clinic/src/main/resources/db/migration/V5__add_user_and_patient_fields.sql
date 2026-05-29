CREATE TABLE users (
    id              BIGSERIAL PRIMARY KEY,
    name            VARCHAR(100)   NOT NULL,
    username        VARCHAR(50)    NOT NULL UNIQUE,
    password        VARCHAR(255)   NOT NULL,
    role            VARCHAR(20)    NOT NULL CHECK (role IN ('DOCTOR', 'RECEPTIONIST')),
    doctor_id       BIGINT         REFERENCES doctors(id) ON DELETE SET NULL,
    created_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

ALTER TABLE patients ADD COLUMN archived BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE patients ADD COLUMN created_by_type VARCHAR(20);
ALTER TABLE patients ADD COLUMN created_by_id BIGINT;
ALTER TABLE patients ADD COLUMN created_by_name VARCHAR(100);
CREATE INDEX idx_patients_archived ON patients (archived);

-- Default users (password is same as username for dev)
INSERT INTO users (name, username, password, role) VALUES
('Admin Doctor', 'doctor', 'doctor123', 'DOCTOR'),
('Receptionist', 'receptionist', 'reception123', 'RECEPTIONIST');
