CREATE TABLE inventory_items (
    id                BIGSERIAL PRIMARY KEY,
    item_name         VARCHAR(200) NOT NULL,
    stock_type        VARCHAR(20)  NOT NULL CHECK (stock_type IN ('INTERNAL', 'EXTERNAL')),
    category          VARCHAR(100),
    quantity          DECIMAL(10,2) NOT NULL DEFAULT 0,
    minimum_threshold DECIMAL(10,2) NOT NULL DEFAULT 5,
    unit_type         VARCHAR(30),
    purchase_price    DECIMAL(10,2),
    selling_price     DECIMAL(10,2),
    supplier_name     VARCHAR(200),
    batch_number      VARCHAR(100),
    expiry_date       DATE,
    description       TEXT,
    archived          BOOLEAN NOT NULL DEFAULT FALSE,
    created_by_id     BIGINT REFERENCES users(id),
    created_at        TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at        TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_inventory_items_type ON inventory_items (stock_type);
CREATE INDEX idx_inventory_items_category ON inventory_items (category);
CREATE INDEX idx_inventory_items_expiry ON inventory_items (expiry_date);
CREATE INDEX idx_inventory_items_archived ON inventory_items (archived);

CREATE TABLE stock_transactions (
    id                BIGSERIAL PRIMARY KEY,
    item_id           BIGINT NOT NULL REFERENCES inventory_items(id) ON DELETE CASCADE,
    quantity_changed  DECIMAL(10,2) NOT NULL,
    transaction_type  VARCHAR(30) NOT NULL,
    previous_quantity DECIMAL(10,2),
    new_quantity      DECIMAL(10,2),
    performed_by_id   BIGINT REFERENCES users(id),
    notes             TEXT,
    reference_type    VARCHAR(30),
    reference_id      BIGINT,
    created_at        TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_stock_transactions_item ON stock_transactions (item_id);
CREATE INDEX idx_stock_transactions_type ON stock_transactions (transaction_type);
CREATE INDEX idx_stock_transactions_created ON stock_transactions (created_at);
