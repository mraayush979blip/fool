-- Change phase_number from INTEGER to NUMERIC to support decimals (e.g., 1.1)
ALTER TABLE phases ALTER COLUMN phase_number TYPE NUMERIC(10,2);
