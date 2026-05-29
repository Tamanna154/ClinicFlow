-- Add default availability for all existing doctors (Mon-Fri, 9AM-5PM, 30min slots)
INSERT INTO doctor_availability (doctor_id, day_of_week, start_time, end_time, slot_duration, is_available)
SELECT d.id, 'MONDAY', '09:00', '17:00', 30, TRUE FROM doctors d
WHERE NOT EXISTS (SELECT 1 FROM doctor_availability da WHERE da.doctor_id = d.id AND da.day_of_week = 'MONDAY');

INSERT INTO doctor_availability (doctor_id, day_of_week, start_time, end_time, slot_duration, is_available)
SELECT d.id, 'TUESDAY', '09:00', '17:00', 30, TRUE FROM doctors d
WHERE NOT EXISTS (SELECT 1 FROM doctor_availability da WHERE da.doctor_id = d.id AND da.day_of_week = 'TUESDAY');

INSERT INTO doctor_availability (doctor_id, day_of_week, start_time, end_time, slot_duration, is_available)
SELECT d.id, 'WEDNESDAY', '09:00', '17:00', 30, TRUE FROM doctors d
WHERE NOT EXISTS (SELECT 1 FROM doctor_availability da WHERE da.doctor_id = d.id AND da.day_of_week = 'WEDNESDAY');

INSERT INTO doctor_availability (doctor_id, day_of_week, start_time, end_time, slot_duration, is_available)
SELECT d.id, 'THURSDAY', '09:00', '17:00', 30, TRUE FROM doctors d
WHERE NOT EXISTS (SELECT 1 FROM doctor_availability da WHERE da.doctor_id = d.id AND da.day_of_week = 'THURSDAY');

INSERT INTO doctor_availability (doctor_id, day_of_week, start_time, end_time, slot_duration, is_available)
SELECT d.id, 'FRIDAY', '09:00', '17:00', 30, TRUE FROM doctors d
WHERE NOT EXISTS (SELECT 1 FROM doctor_availability da WHERE da.doctor_id = d.id AND da.day_of_week = 'FRIDAY');
