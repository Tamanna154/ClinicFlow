ALTER TABLE appointments ADD COLUMN is_online BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE appointments ADD COLUMN meeting_link VARCHAR(500);
ALTER TABLE appointments ADD COLUMN consultation_notes TEXT;
CREATE INDEX idx_appointments_online ON appointments (is_online);
