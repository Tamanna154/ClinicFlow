ALTER TABLE income_records DROP CONSTRAINT IF EXISTS income_records_income_type_check;
ALTER TABLE income_records ADD CONSTRAINT income_records_income_type_check
    CHECK (income_type IN ('APPOINTMENT', 'MEDICINE_SALE', 'LAB_COMMISSION', 'OTHER', 'CONSULTATION'));
