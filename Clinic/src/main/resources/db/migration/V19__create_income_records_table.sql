CREATE TABLE income_records (
    id                BIGSERIAL PRIMARY KEY,
    income_type       VARCHAR(30) NOT NULL CHECK (income_type IN ('APPOINTMENT', 'MEDICINE_SALE', 'LAB_COMMISSION', 'OTHER')),
    reference_id      BIGINT,
    amount            DECIMAL(12,2) NOT NULL,
    payment_method    VARCHAR(20) CHECK (payment_method IN ('CASH', 'UPI', 'CARD', 'MIXED')),
    received_by       BIGINT REFERENCES users(id),
    description       TEXT,
    created_at        TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_income_type ON income_records (income_type);
CREATE INDEX idx_income_date ON income_records (created_at);
CREATE INDEX idx_income_reference ON income_records (reference_id);
