CREATE TABLE doctor_compensation (
    id BIGSERIAL PRIMARY KEY,
    doctor_id BIGINT NOT NULL UNIQUE REFERENCES doctors(id),
    compensation_type VARCHAR(20) NOT NULL CHECK (compensation_type IN ('FIXED_SALARY', 'REVENUE_SHARING', 'HYBRID')),
    fixed_salary DECIMAL(12,2),
    doctor_share_percent DECIMAL(5,2),
    clinic_share_percent DECIMAL(5,2),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE staff_compensation (
    id BIGSERIAL PRIMARY KEY,
    doctor_staff_id BIGINT NOT NULL UNIQUE REFERENCES doctor_staff(id),
    fixed_salary DECIMAL(12,2),
    incentive_percent DECIMAL(5,2),
    performance_bonus DECIMAL(12,2),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE doctor_payouts (
    id BIGSERIAL PRIMARY KEY,
    doctor_id BIGINT NOT NULL REFERENCES doctors(id),
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    total_consultations INTEGER DEFAULT 0,
    total_revenue DECIMAL(12,2) DEFAULT 0,
    doctor_earnings DECIMAL(12,2) DEFAULT 0,
    clinic_share DECIMAL(12,2) DEFAULT 0,
    status VARCHAR(20) DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'PAID')),
    paid_date DATE,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
