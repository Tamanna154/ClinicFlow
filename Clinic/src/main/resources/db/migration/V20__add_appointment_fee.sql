ALTER TABLE appointments
ADD COLUMN appointment_fee DECIMAL(12,2),
ADD COLUMN fee_payment_method VARCHAR(20) CHECK (fee_payment_method IN ('CASH', 'UPI', 'CARD', 'MIXED')),
ADD COLUMN fee_payment_status VARCHAR(20) DEFAULT 'PENDING' CHECK (fee_payment_status IN ('PAID', 'PENDING', 'PARTIAL')),
ADD COLUMN fee_payment_date TIMESTAMP WITH TIME ZONE;
