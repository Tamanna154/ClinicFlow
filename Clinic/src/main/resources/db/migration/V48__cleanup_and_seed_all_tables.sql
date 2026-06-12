-- ============================================================
-- COMPREHENSIVE DATABASE CLEANUP & SEED DATA
-- Removes all old dummy data and inserts proper realistic data
-- ============================================================

-- STEP 1: Clean all existing data (in dependency order)
DELETE FROM salary_payments;
DELETE FROM stock_transactions;
DELETE FROM inventory_items;
DELETE FROM consultation_bills;
DELETE FROM consultations;
DELETE FROM prescriptions;
DELETE FROM bills;
DELETE FROM expenses;
DELETE FROM income_records;
DELETE FROM appointments;
DELETE FROM patient_medications;
DELETE FROM patient_health_logs;
DELETE FROM patient_visits;
DELETE FROM family_members;
DELETE FROM patient_assigned_doctors;
DELETE FROM staff_activities;
DELETE FROM staff_compensation;
DELETE FROM staff_permissions;
DELETE FROM staff_details;
DELETE FROM doctor_staff;
DELETE FROM doctor_availability;
DELETE FROM doctor_achievements;
DELETE FROM reminders;
DELETE FROM letterheads;
DELETE FROM clinics;
DELETE FROM patients;
DELETE FROM doctors;
DELETE FROM users;

-- STEP 2: Seed Users (passwords will be hashed by AdminUserSeeder.java)
-- These are inserted with raw passwords; the seeder will update them if needed
INSERT INTO users (name, username, email, password, role, phone, created_at) VALUES
('Clinic Admin', 'admin@gmail.com', 'admin@gmail.com', 'admin123', 'CLINIC_ADMIN', '9876543210', CURRENT_TIMESTAMP),
('Super Admin', 'superadmin@gmail.com', 'superadmin@gmail.com', 'super123', 'SUPER_ADMIN', '9876543211', CURRENT_TIMESTAMP),
('Dr. Tamanna Oza', 'drtamanna@gmail.com', 'drtamanna@gmail.com', 'Dr@Tamanna', 'DOCTOR', '9876543212', CURRENT_TIMESTAMP),
('Dr. Rajesh Sharma', 'drrajesh@gmail.com', 'drrajesh@gmail.com', 'Dr@Rajesh', 'DOCTOR', '9876543213', CURRENT_TIMESTAMP),
('Dr. Priya Patel', 'drpriya@gmail.com', 'drpriya@gmail.com', 'Dr@Priya', 'DOCTOR', '9876543214', CURRENT_TIMESTAMP),
('Dr. Amit Mehta', 'dramit@gmail.com', 'dramit@gmail.com', 'Dr@Amit', 'DOCTOR', '9876543215', CURRENT_TIMESTAMP),
('Receptionist Rahul', 'receptionist@gmail.com', 'receptionist@gmail.com', 'reception123', 'RECEPTIONIST', '9876543216', CURRENT_TIMESTAMP),
('Patient Dhyey', 'padhyey@gmail.com', 'padhyey@gmail.com', 'Pa@Dhyey', 'PATIENT', '9876543217', CURRENT_TIMESTAMP),
('Patient Sneha', 'psneha@gmail.com', 'psneha@gmail.com', 'Pa@Sneha', 'PATIENT', '9876543218', CURRENT_TIMESTAMP),
('Patient Ravi', 'pravi@gmail.com', 'pravi@gmail.com', 'Pa@Ravi', 'PATIENT', '9876543219', CURRENT_TIMESTAMP),
('Patient Anjali', 'panjali@gmail.com', 'panjali@gmail.com', 'Pa@Anjali', 'PATIENT', '9876543220', CURRENT_TIMESTAMP);

-- STEP 3: Seed Doctors
INSERT INTO doctors (user_id, name, specialization, qualification, email, phone, consultation_fee, is_active, created_at)
SELECT u.id, u.name, 
  CASE 
    WHEN u.name = 'Dr. Tamanna Oza' THEN 'General Physician'
    WHEN u.name = 'Dr. Rajesh Sharma' THEN 'Cardiologist'
    WHEN u.name = 'Dr. Priya Patel' THEN 'Gynecologist'
    WHEN u.name = 'Dr. Amit Mehta' THEN 'Pediatrician'
  END,
  CASE 
    WHEN u.name = 'Dr. Tamanna Oza' THEN 'MBBS, MD'
    WHEN u.name = 'Dr. Rajesh Sharma' THEN 'MBBS, DM Cardiology'
    WHEN u.name = 'Dr. Priya Patel' THEN 'MBBS, MS Obstetrics'
    WHEN u.name = 'Dr. Amit Mehta' THEN 'MBBS, MD Pediatrics'
  END,
  u.email, u.phone,
  CASE 
    WHEN u.name = 'Dr. Tamanna Oza' THEN 500
    WHEN u.name = 'Dr. Rajesh Sharma' THEN 1000
    WHEN u.name = 'Dr. Priya Patel' THEN 800
    WHEN u.name = 'Dr. Amit Mehta' THEN 600
  END,
  TRUE, CURRENT_TIMESTAMP
FROM users u WHERE u.role = 'DOCTOR';

-- STEP 4: Seed Doctor Availability (Mon-Fri, 9AM-5PM, 30min slots)
INSERT INTO doctor_availability (doctor_id, day_of_week, start_time, end_time, slot_duration, is_available)
SELECT d.id, day, time '09:00', time '17:00', 30, TRUE
FROM doctors d
CROSS JOIN (VALUES ('MONDAY'), ('TUESDAY'), ('WEDNESDAY'), ('THURSDAY'), ('FRIDAY')) AS days(day);

-- STEP 5: Seed Patients
INSERT INTO patients (user_id, name, phone, email, age, gender, blood_group, address, created_at)
SELECT u.id, u.name, u.phone, u.email,
  CASE 
    WHEN u.name = 'Patient Dhyey' THEN 28
    WHEN u.name = 'Patient Sneha' THEN 32
    WHEN u.name = 'Patient Ravi' THEN 45
    WHEN u.name = 'Patient Anjali' THEN 26
  END,
  CASE 
    WHEN u.name IN ('Patient Sneha', 'Patient Anjali') THEN 'FEMALE'
    ELSE 'MALE'
  END,
  CASE 
    WHEN u.name = 'Patient Dhyey' THEN 'B+'
    WHEN u.name = 'Patient Sneha' THEN 'O+'
    WHEN u.name = 'Patient Ravi' THEN 'A+'
    WHEN u.name = 'Patient Anjali' THEN 'AB+'
  END,
  CASE 
    WHEN u.name = 'Patient Dhyey' THEN '123 Main St, City'
    WHEN u.name = 'Patient Sneha' THEN '456 Park Ave, City'
    WHEN u.name = 'Patient Ravi' THEN '789 Lake Rd, City'
    WHEN u.name = 'Patient Anjali' THEN '321 Hill Top, City'
  END,
  CURRENT_TIMESTAMP
FROM users u WHERE u.role = 'PATIENT';

-- STEP 6: Seed Appointments (mix of past, today, upcoming)
INSERT INTO appointments (doctor_id, patient_id, appointment_date, start_time, end_time, status, reason, appointment_type, created_at)
SELECT 
  d.id,
  p.id,
  CURRENT_DATE - (random() * 30)::int,
  (time '09:00' + (random() * 8)::int * interval '1 hour')::time,
  (time '09:30' + (random() * 8)::int * interval '1 hour')::time,
  CASE WHEN random() < 0.4 THEN 'COMPLETED' WHEN random() < 0.7 THEN 'SCHEDULED' ELSE 'CONFIRMED' END,
  CASE (random() * 4)::int
    WHEN 0 THEN 'General checkup'
    WHEN 1 THEN 'Fever and cold'
    WHEN 2 THEN 'Blood pressure check'
    WHEN 3 THEN 'Follow-up visit'
    ELSE 'Routine consultation'
  END,
  'IN_PERSON',
  CURRENT_TIMESTAMP - (random() * 30)::int * interval '1 day'
FROM doctors d, patients p
WHERE random() < 0.6
LIMIT 20;

-- Add some today's appointments
INSERT INTO appointments (doctor_id, patient_id, appointment_date, start_time, end_time, status, reason, appointment_type, created_at)
SELECT d.id, p.id, CURRENT_DATE,
  time '10:00', time '10:30', 'SCHEDULED', 'Regular checkup', 'IN_PERSON', CURRENT_TIMESTAMP
FROM doctors d, patients p
WHERE d.name = 'Dr. Tamanna Oza' AND p.name = 'Patient Dhyey';

INSERT INTO appointments (doctor_id, patient_id, appointment_date, start_time, end_time, status, reason, appointment_type, created_at)
SELECT d.id, p.id, CURRENT_DATE,
  time '11:00', time '11:30', 'CONFIRMED', 'Heart consultation', 'IN_PERSON', CURRENT_TIMESTAMP
FROM doctors d, patients p
WHERE d.name = 'Dr. Rajesh Sharma' AND p.name = 'Patient Ravi';

INSERT INTO appointments (doctor_id, patient_id, appointment_date, start_time, end_time, status, reason, appointment_type, created_at)
SELECT d.id, p.id, CURRENT_DATE,
  time '14:00', time '14:30', 'SCHEDULED', 'Prenatal checkup', 'IN_PERSON', CURRENT_TIMESTAMP
FROM doctors d, patients p
WHERE d.name = 'Dr. Priya Patel' AND p.name = 'Patient Sneha';

-- STEP 7: Seed Inventory Items
INSERT INTO inventory_items (item_name, stock_type, category, quantity, minimum_threshold, unit_type, purchase_price, selling_price, supplier_name, batch_number, expiry_date, description, created_by_id)
SELECT * FROM (VALUES
  ('Paracetamol 500mg', 'EXTERNAL', 'Tablets', 500, 50, 'strip', 5.00, 15.00, 'MediSupplies Co.', 'BATCH-001', '2026-12-31', 'Pain reliever and fever reducer', 1),
  ('Amoxicillin 250mg', 'EXTERNAL', 'Tablets', 300, 30, 'strip', 12.00, 35.00, 'PharmaCorp Ltd.', 'BATCH-002', '2026-10-15', 'Antibiotic for infections', 1),
  ('Cetirizine 10mg', 'EXTERNAL', 'Tablets', 400, 40, 'strip', 3.50, 10.00, 'MediSupplies Co.', 'BATCH-003', '2027-01-20', 'Antihistamine for allergies', 1),
  ('Metformin 500mg', 'EXTERNAL', 'Tablets', 350, 35, 'strip', 8.00, 22.00, 'PharmaCorp Ltd.', 'BATCH-004', '2027-04-30', 'Diabetes medication', 1),
  ('Amlodipine 5mg', 'EXTERNAL', 'Tablets', 300, 30, 'strip', 10.00, 28.00, 'MediSupplies Co.', 'BATCH-005', '2026-11-30', 'Blood pressure medication', 1),
  ('Insulin Glargine', 'EXTERNAL', 'Injections', 50, 10, 'vial', 150.00, 350.00, 'BioPharma Ltd.', 'BATCH-006', '2026-08-15', 'Long-acting insulin', 1),
  ('Ibuprofen 400mg', 'EXTERNAL', 'Tablets', 350, 40, 'strip', 6.00, 18.00, 'PharmaCorp Ltd.', 'BATCH-007', '2026-09-30', 'Anti-inflammatory', 1),
  ('ORS Powder Pack', 'EXTERNAL', 'Supplements', 1000, 100, 'pack', 2.00, 8.00, 'HealthCare Ltd.', 'BATCH-008', '2027-03-01', 'Oral rehydration salts', 1),
  ('Omeprazole 20mg', 'EXTERNAL', 'Tablets', 250, 25, 'strip', 7.00, 20.00, 'PharmaCorp Ltd.', 'BATCH-009', '2027-02-28', 'Acid reflux treatment', 1),
  ('Salbutamol Inhaler', 'EXTERNAL', 'Inhalers', 75, 10, 'pcs', 85.00, 200.00, 'BioPharma Ltd.', 'BATCH-010', '2026-07-15', 'Asthma relief inhaler', 1),
  ('Surgical Gloves (Box)', 'INTERNAL', 'Safety', 80, 10, 'box', 120.00, NULL, 'Surgicals India', 'BATCH-011', NULL, 'Latex free gloves - 100pcs', 1),
  ('Face Masks (Pack)', 'INTERNAL', 'Safety', 500, 50, 'pack', 25.00, NULL, 'SafetyFirst Ltd.', 'BATCH-012', NULL, '3-ply surgical masks - 50/pack', 1),
  ('Hand Sanitizer 500ml', 'INTERNAL', 'Cleaning', 50, 8, 'bottle', 55.00, NULL, 'ChemCorp', 'BATCH-013', '2026-06-30', 'Alcohol-based sanitizer', 1),
  ('Cotton Roll 500gm', 'INTERNAL', 'Supplies', 24, 5, 'pack', 65.00, NULL, 'HealthCare Ltd.', 'BATCH-014', NULL, 'Absorbent cotton roll', 1),
  ('Syringe 5ml (Box)', 'INTERNAL', 'Supplies', 60, 10, 'box', 80.00, NULL, 'Surgicals India', 'BATCH-015', NULL, 'Disposable syringes - 100/box', 1)
) AS v(item_name, stock_type, category, quantity, minimum_threshold, unit_type, purchase_price, selling_price, supplier_name, batch_number, expiry_date, description, created_by_id);

-- STEP 8: Stock transactions for initial stock
INSERT INTO stock_transactions (item_id, quantity_changed, transaction_type, previous_quantity, new_quantity, performed_by_id, notes, created_at)
SELECT id, quantity, 'STOCK_ADDED', 0, quantity, 1, 'Initial stock setup', CURRENT_TIMESTAMP
FROM inventory_items
WHERE NOT EXISTS (SELECT 1 FROM stock_transactions st WHERE st.item_id = inventory_items.id);

-- STEP 9: Seed Staff members
INSERT INTO doctor_staff (doctor_user_id, staff_user_id, created_at)
SELECT u.id, s.id, CURRENT_TIMESTAMP
FROM users u, users s
WHERE u.role = 'DOCTOR' AND s.name = 'Receptionist Rahul'
LIMIT 1;

-- STEP 10: Staff Details
INSERT INTO staff_details (doctor_staff_id, staff_name, phone, role, duty_time, fixed_salary, total_paid, pending_salary)
SELECT ds.id, u.name, u.phone, u.role, '9:00 AM - 6:00 PM', 15000.00, 0, 15000.00
FROM doctor_staff ds
JOIN users u ON u.id = ds.staff_user_id;
