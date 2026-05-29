CREATE TABLE doctor_availability (
    id              BIGSERIAL PRIMARY KEY,
    doctor_id       BIGINT         NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
    day_of_week     VARCHAR(10)    NOT NULL,
    start_time      TIME           NOT NULL,
    end_time        TIME           NOT NULL,
    slot_duration   INTEGER        NOT NULL DEFAULT 30,
    is_available    BOOLEAN        NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_doctor_day UNIQUE (doctor_id, day_of_week),
    CONSTRAINT chk_valid_time CHECK (start_time < end_time),
    CONSTRAINT chk_valid_slot CHECK (slot_duration >= 5 AND slot_duration <= 120)
);

CREATE INDEX idx_availability_doctor ON doctor_availability (doctor_id);
