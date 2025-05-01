/*
  Warnings:

  - You are about to drop the column `plan_status` on the `admins` table. All the data in the column will be lost.
  - Added the required column `status` to the `admins` table without a default value. This is not possible if the table is not empty.
  - Added the required column `status` to the `login_credentials` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "admins" DROP COLUMN "plan_status",
ADD COLUMN     "status" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "login_credentials" ADD COLUMN     "status" TEXT NOT NULL;

-- 0) Enable pgcrypto for gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS pgcrypto;  -- for gen_random_uuid() :contentReference[oaicite:0]{index=0}

-- 1) Trigger function to sync login_credentials
CREATE OR REPLACE FUNCTION create_or_update_login_credentials()
RETURNS TRIGGER AS $$
DECLARE
  resolved_admin_id UUID;
BEGIN
  -- Determine the correct admin_id for each source table
  IF TG_TABLE_NAME = 'admins' THEN
    resolved_admin_id := NEW.id;
  ELSIF TG_TABLE_NAME = 'team_members' THEN
    resolved_admin_id := NEW.admin_id;
  ELSIF TG_TABLE_NAME = 'partners' THEN
    resolved_admin_id := NEW.admin_id;
  ELSE
    RAISE EXCEPTION 'Unsupported table: %', TG_TABLE_NAME;
  END IF;

  IF TG_OP = 'INSERT' THEN
    INSERT INTO login_credentials (
      id,
      email,
      password_hash,
      role,
      user_profile_id,
      admin_id,
      status,
      created_at,
      updated_at
    )
    VALUES (
      gen_random_uuid(),   -- random UUID via pgcrypto :contentReference[oaicite:1]{index=1}
      NEW.email,
      NEW.password_hash,
      NEW.role,
      NEW.id,
      resolved_admin_id,
      NEW.status,
      NOW(),
      NOW()
    );
  ELSIF TG_OP = 'UPDATE' THEN
    UPDATE login_credentials
    SET
      email         = NEW.email,
      password_hash = NEW.password_hash,
      role          = NEW.role,
      admin_id      = resolved_admin_id,
      status        = NEW.status,
      updated_at    = NOW()
    WHERE user_profile_id = OLD.id;
  END IF;

  RETURN NEW;  -- required for row-level triggers :contentReference[oaicite:2]{index=2}
END;
$$ LANGUAGE plpgsql;  -- PL/pgSQL trigger functions :contentReference[oaicite:3]{index=3}

-- 2) Attach trigger to admins
CREATE TRIGGER sync_logincred_on_admin
AFTER INSERT OR UPDATE ON admins
FOR EACH ROW
EXECUTE FUNCTION create_or_update_login_credentials();  -- CREATE TRIGGER syntax :contentReference[oaicite:4]{index=4}

-- 3) Attach trigger to team_members
CREATE TRIGGER sync_logincred_on_team_member
AFTER INSERT OR UPDATE ON team_members
FOR EACH ROW
EXECUTE FUNCTION create_or_update_login_credentials();  -- same trigger function :contentReference[oaicite:5]{index=5}

-- 4) Attach trigger to partners
CREATE TRIGGER sync_logincred_on_partner
AFTER INSERT OR UPDATE ON partners
FOR EACH ROW
EXECUTE FUNCTION create_or_update_login_credentials();  -- repeat for partners :contentReference[oaicite:6]{index=6}


