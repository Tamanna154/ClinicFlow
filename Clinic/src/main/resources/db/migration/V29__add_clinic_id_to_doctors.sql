ALTER TABLE doctors ADD COLUMN clinic_id BIGINT;
ALTER TABLE doctors ADD CONSTRAINT fk_doctors_clinic
    FOREIGN KEY (clinic_id) REFERENCES clinics(id) ON DELETE SET NULL;
