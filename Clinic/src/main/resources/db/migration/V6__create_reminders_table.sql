CREATE TABLE reminders (
    id                  BIGSERIAL PRIMARY KEY,
    appointment_id      BIGINT         NOT NULL REFERENCES appointments(id) ON DELETE CASCADE,
    patient_id          BIGINT         NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    patient_name        VARCHAR(150),
    patient_phone       VARCHAR(20),
    doctor_name         VARCHAR(150),
    appointment_date    TIMESTAMP,
    reminder_time       TIMESTAMP      NOT NULL,
    message             TEXT,
    sent                BOOLEAN        NOT NULL DEFAULT FALSE,
    send_sms            BOOLEAN        NOT NULL DEFAULT TRUE,
    created_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_reminders_appointment ON reminders (appointment_id);
CREATE INDEX idx_reminders_patient ON reminders (patient_id);
CREATE INDEX idx_reminders_sent_time ON reminders (sent, reminder_time);
