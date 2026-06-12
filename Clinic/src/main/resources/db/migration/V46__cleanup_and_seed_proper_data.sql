-- Cleanup old demo data and seed proper data
-- Removes dummy inventory, old appointments, and test records

-- Remove old demo inventory data (from V16)
DELETE FROM stock_transactions WHERE item_id IN (SELECT id FROM inventory_items WHERE description LIKE '%demo%' OR batch_number = 'BATCH-001');
DELETE FROM inventory_items WHERE description LIKE '%demo%' OR batch_number = 'BATCH-001';

-- Remove cancelled/old test appointments
DELETE FROM appointments WHERE status = 'CANCELLED' AND appointment_date < CURRENT_DATE - 30;
DELETE FROM appointments WHERE reason IS NULL AND notes IS NULL AND appointment_date < CURRENT_DATE - 60;

-- Seed proper inventory data with correct references
-- Use a subquery to get the first admin/doctor user ID dynamically
DO $$
DECLARE
    user_id BIGINT;
BEGIN
    SELECT id INTO user_id FROM users WHERE role IN ('DOCTOR', 'CLINIC_ADMIN', 'SUPER_ADMIN') LIMIT 1;
    IF user_id IS NOT NULL THEN

INSERT INTO inventory_items (item_name, stock_type, category, quantity, minimum_threshold, unit_type, purchase_price, selling_price, supplier_name, batch_number, expiry_date, description, created_by_id)
VALUES
    ('Paracetamol 500mg', 'EXTERNAL', 'Tablets', 500, 50, 'strip', 5.00, 15.00, 'MediSupplies Co.', 'BATCH-PCM-2026', '2026-12-31', 'Common pain reliever and fever reducer', user_id),
    ('Amoxicillin 250mg', 'EXTERNAL', 'Tablets', 300, 30, 'strip', 12.00, 35.00, 'PharmaCorp Ltd.', 'BATCH-AMX-2026', '2026-10-15', 'Antibiotic for bacterial infections', user_id),
    ('Cetirizine 10mg', 'EXTERNAL', 'Tablets', 400, 40, 'strip', 3.50, 10.00, 'MediSupplies Co.', 'BATCH-CTZ-2027', '2027-01-20', 'Antihistamine for allergies', user_id),
    ('Insulin Glargine 100IU', 'EXTERNAL', 'Injections', 50, 10, 'vial', 150.00, 350.00, 'BioPharma Ltd.', 'BATCH-INS-2026', '2026-08-15', 'Long-acting insulin for diabetes', user_id),
    ('Bandage Roll 4inch', 'EXTERNAL', 'Bandages', 200, 20, 'pcs', 8.00, 25.00, 'Surgicals India', 'BATCH-BND-2026', NULL, 'Sterile gauze bandage for wound dressing', user_id),
    ('Ibuprofen 400mg', 'EXTERNAL', 'Tablets', 350, 40, 'strip', 6.00, 18.00, 'PharmaCorp Ltd.', 'BATCH-IBU-2026', '2026-09-30', 'Anti-inflammatory pain reliever', user_id),
    ('ORS Powder Pack', 'EXTERNAL', 'Supplements', 1000, 100, 'pack', 2.00, 8.00, 'HealthCare Ltd.', 'BATCH-ORS-2027', '2027-03-01', 'Oral rehydration salts', user_id),
    ('Dettol Antiseptic 100ml', 'INTERNAL', 'Cleaning', 30, 5, 'bottle', 45.00, NULL, 'ChemCorp', 'BATCH-DTL-2026', '2026-11-01', 'Antiseptic disinfectant liquid', user_id),
    ('Surgical Gloves (Box)', 'INTERNAL', 'Safety', 80, 10, 'box', 120.00, NULL, 'Surgicals India', 'BATCH-GLV-2026', NULL, 'Latex free surgical gloves - 100 pairs/box', user_id),
    ('Face Masks 3-ply (Pack)', 'INTERNAL', 'Safety', 500, 50, 'pack', 25.00, NULL, 'SafetyFirst Ltd.', 'BATCH-MSK-2026', NULL, '3-ply surgical face masks - 50/pack', user_id),
    ('Syringe 5ml (Box)', 'INTERNAL', 'Supplies', 60, 10, 'box', 80.00, NULL, 'Surgicals India', 'BATCH-SYR-2026', NULL, 'Disposable syringes - 100/box', user_id),
    ('Cotton Roll 500gm', 'INTERNAL', 'Supplies', 24, 5, 'pack', 65.00, NULL, 'HealthCare Ltd.', 'BATCH-CTN-2026', NULL, 'Absorbent cotton roll', user_id),
    ('Hand Sanitizer 500ml', 'INTERNAL', 'Cleaning', 50, 8, 'bottle', 55.00, NULL, 'ChemCorp', 'BATCH-SAN-2026', '2026-06-30', 'Alcohol-based hand sanitizer', user_id),
    ('Omeprazole 20mg', 'EXTERNAL', 'Tablets', 250, 30, 'strip', 7.00, 20.00, 'PharmaCorp Ltd.', 'BATCH-OME-2027', '2027-02-28', 'Acid reflux and heartburn treatment', user_id),
    ('Salbutamol Inhaler 100mcg', 'EXTERNAL', 'Inhalers', 75, 10, 'pcs', 85.00, 200.00, 'BioPharma Ltd.', 'BATCH-SAL-2026', '2026-07-15', 'Asthma relief inhaler', user_id),
    ('Metformin 500mg', 'EXTERNAL', 'Tablets', 400, 40, 'strip', 8.00, 22.00, 'PharmaCorp Ltd.', 'BATCH-MET-2027', '2027-04-30', 'Diabetes medication', user_id),
    ('Amlodipine 5mg', 'EXTERNAL', 'Tablets', 300, 30, 'strip', 10.00, 28.00, 'MediSupplies Co.', 'BATCH-AMD-2026', '2026-11-30', 'Blood pressure medication', user_id),
    ('Vitamin D3 60K IU', 'EXTERNAL', 'Supplements', 200, 20, 'strip', 15.00, 40.00, 'HealthCare Ltd.', 'BATCH-VIT-2027', '2027-05-15', 'Vitamin D3 supplement', user_id),
    ('Multivitamin Tablets', 'EXTERNAL', 'Supplements', 600, 50, 'strip', 4.00, 12.00, 'HealthCare Ltd.', 'BATCH-MVT-2027', '2027-06-01', 'Daily multivitamin supplement', user_id),
    ('Azithromycin 500mg', 'EXTERNAL', 'Tablets', 200, 20, 'strip', 18.00, 50.00, 'PharmaCorp Ltd.', 'BATCH-AZI-2026', '2026-08-30', 'Antibiotic for respiratory infections', user_id);

-- Add stock transaction records
INSERT INTO stock_transactions (item_id, quantity_changed, transaction_type, previous_quantity, new_quantity, performed_by_id, notes, created_at)
SELECT id, quantity, 'STOCK_ADDED', 0, quantity, user_id, 'Initial stock setup', CURRENT_TIMESTAMP
FROM inventory_items
WHERE NOT EXISTS (SELECT 1 FROM stock_transactions st WHERE st.item_id = inventory_items.id);

    END IF;
END $$;
