-- V50: Add suppliers and more staff seed data
-- Only inserts if tables are empty (idempotent)

-- Suppliers
INSERT INTO suppliers (supplier_name, contact_person, phone, email, address, created_at)
SELECT * FROM (VALUES
    ('MediSupplies Co.', 'Rahul Sharma', '9876500001', 'rahul@medisupplies.com', '45, Industrial Area, Mumbai', CURRENT_TIMESTAMP),
    ('PharmaCorp Ltd.', 'Priya Patel', '9876500002', 'priya@pharmacorp.com', '78, Business Park, Delhi', CURRENT_TIMESTAMP),
    ('BioPharma Ltd.', 'Amit Joshi', '9876500003', 'amit@biopharma.com', '12, Research Colony, Bangalore', CURRENT_TIMESTAMP),
    ('Surgicals India', 'Suresh Reddy', '9876500004', 'suresh@surgicalsindia.com', '33, Med City, Hyderabad', CURRENT_TIMESTAMP),
    ('HealthCare Ltd.', 'Neha Gupta', '9876500005', 'neha@healthcareltd.com', '56, Health Hub, Pune', CURRENT_TIMESTAMP),
    ('ChemCorp', 'Vikram Singh', '9876500006', 'vikram@chemcorp.com', '90, Chemical Zone, Ahmedabad', CURRENT_TIMESTAMP),
    ('SafetyFirst Ltd.', 'Anita Desai', '9876500007', 'anita@safetyfirst.com', '21, Safety Park, Chennai', CURRENT_TIMESTAMP)
) AS v(supplier_name, contact_person, phone, email, address, created_at)
WHERE NOT EXISTS (SELECT 1 FROM suppliers LIMIT 1);

-- More staff members for the admin
DO $$
DECLARE
    admin_user_id BIGINT;
    receptionist_user_id BIGINT;
    staff_user_id BIGINT;
BEGIN
    SELECT id INTO admin_user_id FROM users WHERE username = 'clincflow@gmail.com' LIMIT 1;
    IF admin_user_id IS NULL THEN
        SELECT id INTO admin_user_id FROM users WHERE role IN ('CLINIC_ADMIN', 'SUPER_ADMIN') LIMIT 1;
    END IF;

    IF admin_user_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM doctor_staff LIMIT 1) THEN
        -- Create more staff users
        INSERT INTO users (name, username, email, password, role, phone, created_at)
        VALUES 
            ('Inventory Manager Amit', 'inventory@gmail.com', 'inventory@gmail.com', 'St@Amit', 'RECEPTIONIST', '9876500011', CURRENT_TIMESTAMP),
            ('Pharmacist Priya', 'pharmacist@gmail.com', 'pharmacist@gmail.com', 'St@Priya', 'RECEPTIONIST', '9876500012', CURRENT_TIMESTAMP),
            ('Accountant Rohan', 'accountant@gmail.com', 'accountant@gmail.com', 'St@Rohan', 'RECEPTIONIST', '9876500013', CURRENT_TIMESTAMP),
            ('Lab Tech Sneha', 'labtech@gmail.com', 'labtech@gmail.com', 'St@Sneha', 'RECEPTIONIST', '9876500014', CURRENT_TIMESTAMP)
        ON CONFLICT (username) DO NOTHING;

        -- Link them as staff for the admin
        FOR staff_user_id IN SELECT id FROM users WHERE username IN ('inventory@gmail.com', 'pharmacist@gmail.com', 'accountant@gmail.com', 'labtech@gmail.com')
        LOOP
            INSERT INTO doctor_staff (doctor_user_id, staff_user_id, created_at)
            VALUES (admin_user_id, staff_user_id, CURRENT_TIMESTAMP)
            ON CONFLICT (staff_user_id) DO NOTHING;
        END LOOP;

        -- Add staff details with auto-set duty timing
        INSERT INTO staff_details (doctor_staff_id, full_name, phone, role_title, duty_time, is_active, fixed_salary, total_paid, pending_salary, created_at, updated_at)
        SELECT ds.id, u.name, u.phone, 
            CASE 
                WHEN u.username = 'inventory@gmail.com' THEN 'INVENTORY_MANAGER'
                WHEN u.username = 'pharmacist@gmail.com' THEN 'PHARMACIST'
                WHEN u.username = 'accountant@gmail.com' THEN 'ACCOUNTANT'
                WHEN u.username = 'labtech@gmail.com' THEN 'LAB_TECHNICIAN'
            END,
            '9:00 AM - 6:00 PM', TRUE, 15000, 0, 15000, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
        FROM doctor_staff ds
        JOIN users u ON u.id = ds.staff_user_id
        WHERE ds.doctor_user_id = admin_user_id
        AND u.username IN ('inventory@gmail.com', 'pharmacist@gmail.com', 'accountant@gmail.com', 'labtech@gmail.com')
        AND NOT EXISTS (SELECT 1 FROM staff_details sd WHERE sd.doctor_staff_id = ds.id);
    END IF;
END $$;
