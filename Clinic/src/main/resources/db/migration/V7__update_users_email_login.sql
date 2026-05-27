-- Update default users to use email-style login
UPDATE users SET username = 'doctor@gmail.com', name = 'Dr. Admin' WHERE username = 'doctor';
UPDATE users SET username = 'receptionist@gmail.com', name = 'Receptionist' WHERE username = 'receptionist';
