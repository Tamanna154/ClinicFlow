CREATE TABLE doctors (
    id              BIGSERIAL PRIMARY KEY,
    name            VARCHAR(150)   NOT NULL,
    email           VARCHAR(100)   NOT NULL UNIQUE,
    phone           VARCHAR(20),
    specialization  VARCHAR(100),
    qualifications  TEXT,
    bio             TEXT,
    consultation_fee DECIMAL(10,2),
    is_active       BOOLEAN        NOT NULL DEFAULT TRUE,
    google_calendar_enabled BOOLEAN NOT NULL DEFAULT FALSE,
    google_refresh_token TEXT,
    created_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_doctors_name ON doctors (name);
CREATE INDEX idx_doctors_specialization ON doctors (specialization);
