CREATE TABLE bills (
    id                BIGSERIAL PRIMARY KEY,
    bill_number       VARCHAR(50) NOT NULL UNIQUE,
    patient_id        BIGINT NOT NULL REFERENCES patients(id),
    created_by        BIGINT NOT NULL REFERENCES users(id),
    subtotal          DECIMAL(12,2) NOT NULL DEFAULT 0,
    discount          DECIMAL(12,2) NOT NULL DEFAULT 0,
    tax               DECIMAL(12,2) NOT NULL DEFAULT 0,
    total_amount      DECIMAL(12,2) NOT NULL DEFAULT 0,
    payment_status    VARCHAR(20) NOT NULL DEFAULT 'PENDING' CHECK (payment_status IN ('PAID', 'PENDING', 'PARTIAL')),
    payment_method    VARCHAR(20) CHECK (payment_method IN ('CASH', 'UPI', 'CARD', 'MIXED')),
    bill_date         TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    created_at        TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at        TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_bills_patient ON bills (patient_id);
CREATE INDEX idx_bills_date ON bills (bill_date);
CREATE INDEX idx_bills_status ON bills (payment_status);

CREATE TABLE bill_items (
    id                BIGSERIAL PRIMARY KEY,
    bill_id           BIGINT NOT NULL REFERENCES bills(id) ON DELETE CASCADE,
    inventory_item_id BIGINT NOT NULL REFERENCES inventory_items(id),
    item_name         VARCHAR(200) NOT NULL,
    quantity          DECIMAL(10,2) NOT NULL,
    selling_price     DECIMAL(10,2) NOT NULL,
    line_total        DECIMAL(12,2) NOT NULL
);

CREATE INDEX idx_bill_items_bill ON bill_items (bill_id);
