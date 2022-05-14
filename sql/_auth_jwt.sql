-- external jwt library
\ir _pgjwt.sql

--------- JWT based auth (/rpc/signin, /rpc/me, /rpc/signout, ...)
DO $$ BEGIN
CREATE TYPE auth.jwt_token AS (token text);
EXCEPTION WHEN duplicate_object THEN null;
END $$;

--create or replace function auth.authenticate() returns void as $$
--begin
--  if current_setting('request.jwt.claims', true)::json->>'role' = 'app_user' then
--    raise insufficient_privilege using hint = 'Nope, we are on to you';
--  end if;
--    if session_user_id is not null then
--      set local role to app_user;
--      perform set_config('auth.id', session_user_id::text, true);
--    else
--      set local role to anonymous;
--      perform set_config('auth.id', '', true);
--    end if;
--end
--$$ language plpgsql;

-- GET /rpc/register endpoint
create or replace function register(id text, pass text) returns void as $$
begin
  insert into auth.users(id, pass) values(register.id, register.pass);
  perform login(id, pass);
end;
$$ language plpgsql security definer;

-- GET /rpc/signout endpoint
create or replace function logout() returns void as $$
begin
  perform set_config('response.headers', '[{"Set-Cookie": "jwt=0; Path=/; Max-Age=0; HttpOnly"}]', true);
end;
$$ language plpgsql IMMUTABLE; -- IMMUTABLE can be GET

-- GET /rpc/me endpoint
create or replace function me() returns json
as $$
  select current_setting('request.jwt.claims', true)::json
$$ language sql IMMUTABLE; -- IMMUTABLE can be GET

-- POST /rpc/signin endpoint
create or replace function login(id text, pass text) returns auth.jwt_token as $$
declare _role name; result auth.jwt_token;
begin
  select auth.valid(id, pass) into _role;
  if _role is null then raise invalid_password using message = 'bad credential'; end if;
  select sign(row_to_json(r), current_setting('app.settings.jwt_secret')) as token
    from (
      select
        _role as role,
        login.id as id,
        extract(epoch from now())::integer + 3153600 as exp -- 365*24*60*60
    ) r
    into result;
  perform set_config('response.headers', '[{"Set-Cookie": "jwt='||result.token||'; Path=/; Max-Age=3153600; HttpOnly"}]', true);
  return result;
end;
$$ language plpgsql security definer;
