-- Seed demo inventory items for testing
-- Assumes at least one user exists (doctor with ID 1)

INSERT INTO inventory_items (item_name, stock_type, category, quantity, minimum_threshold, unit_type, purchase_price, selling_price, supplier_name, batch_number, expiry_date, description, created_by_id)
VALUES
    ('Paracetamol 500mg', 'EXTERNAL', 'Tablets', 250, 50, 'strip', 5.00, 15.00, 'MediSupplies Co.', 'BATCH-001', '2026-12-31', 'Common pain reliever and fever reducer', 1),
    ('Amoxicillin 250mg', 'EXTERNAL', 'Tablets', 180, 30, 'strip', 12.00, 35.00, 'PharmaCorp', 'BATCH-002', '2026-10-15', 'Antibiotic for bacterial infections', 1),
    ('Cetirizine 10mg', 'EXTERNAL', 'Tablets', 300, 40, 'strip', 3.50, 10.00, 'MediSupplies Co.', 'BATCH-003', '2027-01-20', 'Antihistamine for allergies', 1),
    ('Insulin Glargine', 'EXTERNAL', 'Injections', 20, 10, 'vial', 150.00, 350.00, 'BioPharma Ltd.', 'BATCH-004', '2026-08-15', 'Long-acting insulin for diabetes', 1),
    ('Bandage Roll 4inch', 'EXTERNAL', 'Bandages', 100, 20, 'pcs', 8.00, 25.00, 'Surgicals India', 'BATCH-005', NULL, 'Sterile gauze bandage for wound dressing', 1),
    ('Ibuprofen 400mg', 'EXTERNAL', 'Tablets', 200, 40, 'strip', 6.00, 18.00, 'PharmaCorp', 'BATCH-006', '2026-09-30', 'Anti-inflammatory pain reliever', 1),
    ('ORS Powder Pack', 'EXTERNAL', 'Supplements', 500, 100, 'pack', 2.00, 8.00, 'HealthCare Ltd.', 'BATCH-007', '2027-03-01', 'Oral rehydration salts', 1),
    ('Dettol Antiseptic', 'INTERNAL', 'Cleaning Supplies', 15, 5, 'bottle', 45.00, NULL, 'ChemCorp', 'BATCH-008', '2026-11-01', 'Antiseptic disinfectant liquid', 1),
    ('Surgical Gloves (Box)', 'INTERNAL', 'Gloves', 50, 10, 'box', 120.00, NULL, 'Surgicals India', 'BATCH-009', NULL, 'Latex free surgical gloves - 100 pairs/box', 1),
    ('Face Masks (Pack)', 'INTERNAL', 'Masks', 200, 50, 'pack', 25.00, NULL, 'SafetyFirst Ltd.', 'BATCH-010', NULL, '3-ply surgical face masks - 50/pack', 1),
    ('Syringe 5ml (Box)', 'INTERNAL', 'Syringes', 30, 10, 'box', 80.00, NULL, 'Surgicals India', 'BATCH-011', NULL, 'Disposable syringes - 100/box', 1),
    ('Cotton Roll 500gm', 'INTERNAL', 'Cotton', 12, 5, 'pack', 65.00, NULL, 'HealthCare Ltd.', 'BATCH-012', NULL, 'Absorbent cotton roll', 1),
    ('Hand Sanitizer 500ml', 'INTERNAL', 'Sanitizer', 25, 8, 'bottle', 55.00, NULL, 'ChemCorp', 'BATCH-013', '2026-06-30', 'Alcohol-based hand sanitizer', 1),
    ('Omeprazole 20mg', 'EXTERNAL', 'Tablets', 150, 30, 'strip', 7.00, 20.00, 'PharmaCorp', 'BATCH-014', '2027-02-28', 'Acid reflux and heartburn treatment', 1),
    ('Salbutamol Inhaler', 'EXTERNAL', 'Drops', 45, 10, 'pcs', 85.00, 200.00, 'BioPharma Ltd.', 'BATCH-015', '2026-07-15', 'Asthma relief inhaler', 1);

-- Add stock transaction records for the initial stock
INSERT INTO stock_transactions (item_id, quantity_changed, transaction_type, previous_quantity, new_quantity, performed_by_id, notes, created_at)
SELECT id, quantity, 'STOCK_ADDED', 0, quantity, 1, 'Initial stock setup', created_at
FROM inventory_items;
