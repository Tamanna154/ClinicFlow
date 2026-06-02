ALTER TABLE prescription_medicines ADD COLUMN IF NOT EXISTS inventory_item_id BIGINT REFERENCES inventory_items(id);

CREATE INDEX IF NOT EXISTS idx_prescription_medicines_inventory ON prescription_medicines(inventory_item_id);
