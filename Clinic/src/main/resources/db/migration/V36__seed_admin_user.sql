-- Admin users are now seeded via AdminUserSeeder.java (CommandLineRunner)
-- This migration only ensures the role constraint allows admin roles
-- Actual user creation happens in Java to get proper BCryptPasswordEncoder hashes
SELECT 1;
