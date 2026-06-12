-- Salary Payments Table for Admin to pay staff directly
CREATE TABLE IF NOT EXISTS salary_payments (
    id BIGSERIAL PRIMARY KEY,
    staff_id BIGINT NOT NULL REFERENCES doctor_staff(id) ON DELETE CASCADE,
    amount DECIMAL(12,2) NOT NULL,
    payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
    payment_method VARCHAR(50) DEFAULT 'CASH',
    status VARCHAR(20) NOT NULL DEFAULT 'PAID',
    notes TEXT,
    paid_by BIGINT REFERENCES users(id),
    transaction_ref VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Add salary tracking columns to staff_details
ALTER TABLE staff_details ADD COLUMN IF NOT EXISTS last_payment_date DATE;
ALTER TABLE staff_details ADD COLUMN IF NOT EXISTS last_payment_amount DECIMAL(12,2) DEFAULT 0;
ALTER TABLE staff_details ADD COLUMN IF NOT EXISTS total_paid DECIMAL(12,2) DEFAULT 0;
ALTER TABLE staff_details ADD COLUMN IF NOT EXISTS pending_salary DECIMAL(12,2) DEFAULT 0;

-- Fix ON DELETE CASCADE for all staff-related tables
DO $$
BEGIN
    BEGIN
        ALTER TABLE staff_compensation DROP CONSTRAINT IF EXISTS fk_staff_compensation_doctor_staff;
        ALTER TABLE staff_compensation ADD CONSTRAINT fk_staff_compensation_doctor_staff
            FOREIGN KEY (doctor_staff_id) REFERENCES doctor_staff(id) ON DELETE CASCADE;
    EXCEPTION WHEN others THEN RAISE NOTICE 'staff_compensation constraint skipped: %', SQLERRM;
    END;

    BEGIN
        ALTER TABLE staff_details DROP CONSTRAINT IF EXISTS fk_staff_details_doctor_staff;
        ALTER TABLE staff_details ADD CONSTRAINT fk_staff_details_doctor_staff
            FOREIGN KEY (doctor_staff_id) REFERENCES doctor_staff(id) ON DELETE CASCADE;
    EXCEPTION WHEN others THEN RAISE NOTICE 'staff_details constraint skipped: %', SQLERRM;
    END;

    BEGIN
        ALTER TABLE staff_permissions DROP CONSTRAINT IF EXISTS fk_staff_permissions_doctor_staff;
        ALTER TABLE staff_permissions ADD CONSTRAINT fk_staff_permissions_doctor_staff
            FOREIGN KEY (doctor_staff_id) REFERENCES doctor_staff(id) ON DELETE CASCADE;
    EXCEPTION WHEN others THEN RAISE NOTICE 'staff_permissions constraint skipped: %', SQLERRM;
    END;
END $$;

-- Update existing staff_details to have default values
UPDATE staff_details SET pending_salary = COALESCE(fixed_salary, 0) WHERE pending_salary IS NULL;
UPDATE staff_details SET total_paid = 0 WHERE total_paid IS NULL;
