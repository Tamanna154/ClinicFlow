-- Add duty time to staff details
ALTER TABLE staff_details ADD COLUMN duty_time VARCHAR(100);

-- Patient meal timings
CREATE TABLE patient_meal_timings (
    id BIGSERIAL PRIMARY KEY,
    patient_id BIGINT NOT NULL UNIQUE REFERENCES patients(id),
    breakfast_time VARCHAR(20) NOT NULL DEFAULT '08:00 AM',
    lunch_time VARCHAR(20) NOT NULL DEFAULT '01:30 PM',
    dinner_time VARCHAR(20) NOT NULL DEFAULT '08:30 PM',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Patient medication trackers
CREATE TABLE patient_medications (
    id BIGSERIAL PRIMARY KEY,
    patient_id BIGINT NOT NULL REFERENCES patients(id),
    medicine_name VARCHAR(100) NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 0,
    dosage VARCHAR(50) DEFAULT '1 tablet',
    timing_category VARCHAR(20) NOT NULL, -- BREAKFAST, LUNCH, DINNER
    relation_to_meal VARCHAR(20) NOT NULL, -- BEFORE_MEAL, AFTER_MEAL
    special_instruction VARCHAR(255) DEFAULT 'Take with water',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Health camps
CREATE TABLE medical_camps (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    description TEXT,
    camp_date DATE NOT NULL,
    location VARCHAR(255) NOT NULL,
    specialty VARCHAR(100),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seed health camps
INSERT INTO medical_camps (name, description, camp_date, location, specialty) VALUES
('Free Eye Care Camp', 'Get your eyes checked by senior ophthalmologists. Free consultation and vision screening.', CURRENT_DATE + INTERVAL '5 days', 'Clinic Community Hall, Block B', 'Ophthalmology'),
('Cardiac & Health Awareness Camp', 'ECG, Blood Pressure testing, and cardiac consultation by leading heart specialists.', CURRENT_DATE + INTERVAL '12 days', 'Main Clinic Lobby', 'Cardiology'),
('Diabetes & Thyroid Screening Camp', 'Free blood sugar checkup and counseling on diabetes management.', CURRENT_DATE + INTERVAL '20 days', 'Room 102, Ground Floor', 'Endocrinology');
