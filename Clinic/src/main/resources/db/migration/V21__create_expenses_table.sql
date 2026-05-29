CREATE TABLE expenses (
    id                BIGSERIAL PRIMARY KEY,
    expense_category  VARCHAR(50) NOT NULL,
    amount            DECIMAL(12,2) NOT NULL,
    description       TEXT,
    expense_date      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    created_by        BIGINT REFERENCES users(id),
    created_at        TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_expenses_category ON expenses (expense_category);
CREATE INDEX idx_expenses_date ON expenses (expense_date);
