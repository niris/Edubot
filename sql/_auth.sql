-- We put auth inside the auth schema to hide them from public view.
-- Certain public procs/views will refer to helpers and tables inside.
create role "anon" nologin; -- PGRST_DB_ANON_ROLE will log into this
create role "user" nologin;

-- allow "root" to switch to our defined roles
GRANT "anon" TO root;
GRANT "user" TO root;

create schema if not exists auth;
create table if not exists auth.users (
  "id"   text primary key,
  "pass" text not null check (length("pass") < 512), -- an encrypt_pass trigger will handle this field
  "role" name not null check (length("role") < 512) default 'user'  -- role can't be FK enforced, we'll use a trigger
);

-- auth.users.role enforcement
create or replace function auth.check_role_exists() returns trigger as $$
begin
  if not exists (select 1 from pg_roles as r where r.rolname = new.role) then
    raise foreign_key_violation using message = 'bad role: ' || new.role;
    return null;
  end if;
  return new;
end
$$ language plpgsql;

drop trigger if exists ensure_user_role_exists on auth.users;
create constraint trigger ensure_user_role_exists
  after insert or update on auth.users
  for each row
  execute procedure auth.check_role_exists();

-- auth.users.pass auto-encryption
create extension if not exists pgcrypto;
create or replace function auth.encrypt_pass() returns trigger as $$
begin
  if tg_op = 'INSERT' or new.pass <> old.pass then
    new.pass = crypt(new.pass, gen_salt('bf'));
  end if;
  return new;
end
$$ language plpgsql;

drop trigger if exists encrypt_pass on auth.users;
create trigger encrypt_pass
  before insert or update on auth.users
  for each row
  execute procedure auth.encrypt_pass();

-- user login verification helper used to generate JWT
create or replace function auth.valid(id text, pass text) returns name as $$
begin
  return (
  select role from auth.users
   where users.id = valid.id
     and users.pass = crypt(valid.pass, users.pass)
  );
end;
$$ language plpgsql;

create or replace function auth.id() returns name as $$
begin
	return current_setting('request.jwt.claims', true)::json->>'id';
end;
$$ language plpgsql;