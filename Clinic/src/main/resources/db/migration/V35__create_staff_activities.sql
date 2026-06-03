CREATE TABLE staff_activities (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id),
    user_name VARCHAR(100),
    activity_type VARCHAR(50) NOT NULL,
    description TEXT,
    reference_id BIGINT,
    reference_type VARCHAR(50),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
