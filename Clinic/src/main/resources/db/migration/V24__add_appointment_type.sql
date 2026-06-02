ALTER TABLE appointments ADD COLUMN IF NOT EXISTS appointment_type VARCHAR(20);

UPDATE appointments SET appointment_type = CASE WHEN is_online = true THEN 'ONLINE' ELSE 'IN_PERSON' END WHERE appointment_type IS NULL;
