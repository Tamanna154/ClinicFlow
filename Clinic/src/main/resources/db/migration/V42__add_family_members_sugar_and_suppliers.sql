-- Add blood_sugar to consultations
ALTER TABLE consultations ADD COLUMN blood_sugar VARCHAR(20);

-- Create patient_family_members table
CREATE TABLE patient_family_members (
    id BIGSERIAL PRIMARY KEY,
    patient_id BIGINT NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    name VARCHAR(150) NOT NULL,
    relationship VARCHAR(50) NOT NULL,
    age INTEGER,
    gender VARCHAR(20),
    phone VARCHAR(20),
    medical_history TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for patient_family_members lookups
CREATE INDEX idx_family_members_patient ON patient_family_members(patient_id);

-- Create suppliers table
CREATE TABLE suppliers (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(200) NOT NULL UNIQUE,
    contact_person VARCHAR(150),
    phone VARCHAR(20),
    email VARCHAR(150),
    address TEXT,
    gst_number VARCHAR(50),
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seed some default suppliers
INSERT INTO suppliers (name, contact_person, phone, email, address, gst_number) VALUES
('Acme Pharmaceuticals', 'John Doe', '9876543220', 'sales@acmepharma.com', 'Phase 1, Industrial Area, City', 'GST22AABBCC11D1'),
('MediSource Distributors', 'Jane Smith', '9876543221', 'support@medisource.com', 'S2, Tech Park, Metro City', 'GST22AABBCC22D2'),
('Global Surgical Goods', 'Robert Lee', '9876543222', 'info@globalsurgical.com', 'Suite 101, Medical Plaza, Capital', 'GST22AABBCC33D3');
