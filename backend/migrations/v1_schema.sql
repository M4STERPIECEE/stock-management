-- Enable UUID extension for unique identifiers
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
-- Enum for Product Stock Status
DO $$ BEGIN CREATE TYPE stock_status_enum AS ENUM ('CRITIQUE', 'EN_STOCK', 'RUPTURE', 'FAIBLE');
EXCEPTION
WHEN duplicate_object THEN null;
END $$;
-- Enum for Order Status
DO $$ BEGIN CREATE TYPE order_status_enum AS ENUM ('LIVREE', 'EN_ATTENTE', 'EXPEDIEE', 'ANNULEE');
EXCEPTION
WHEN duplicate_object THEN null;
END $$;