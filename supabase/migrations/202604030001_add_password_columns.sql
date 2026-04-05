-- Migration: Add password columns to users table
-- Description: Adds password_hash and password_salt for manual authentication.

alter table public.users
add column if not exists password_hash text,
add column if not exists password_salt text;

-- Add comments for documentation
comment on column public.users.password_hash is 'Hashed password for manual authentication';
comment on column public.users.password_salt is 'Salt used for password hashing';
