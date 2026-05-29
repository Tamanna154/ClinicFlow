CREATE TABLE IF NOT EXISTS doctor_staff (
    id BIGSERIAL PRIMARY KEY,
    doctor_user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    staff_user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    UNIQUE (staff_user_id)
);

CREATE INDEX IF NOT EXISTS idx_doctor_staff_doctor ON doctor_staff (doctor_user_id);

CREATE TABLE IF NOT EXISTS staff_permissions (
    id BIGSERIAL PRIMARY KEY,
    doctor_staff_id BIGINT NOT NULL REFERENCES doctor_staff(id) ON DELETE CASCADE,
    permission VARCHAR(50) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    UNIQUE (doctor_staff_id, permission)
);

CREATE INDEX IF NOT EXISTS idx_staff_permissions_staff ON staff_permissions (doctor_staff_id);
