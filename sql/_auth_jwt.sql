-- external jwt library
\ir _pgjwt.sql

--------- JWT response Type
DO $$ BEGIN
CREATE TYPE auth.jwt_token AS (token text);
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- GET /rpc/register endpoint
create or replace function register(id text, pass text) returns void as $$
begin
  insert into auth.users(id, pass) values(register.id, register.pass);
  perform login(id, pass);
end;
$$ language plpgsql security definer;
GRANT EXECUTE ON FUNCTION register TO "anon";

-- GET /rpc/me endpoint
create or replace function me() returns json
as $$
  select current_setting('request.jwt.claims', true)::json
$$ language sql IMMUTABLE; -- IMMUTABLE can be GET
GRANT EXECUTE ON FUNCTION me TO "user", "admin";

-- POST /rpc/signin endpoint
create or replace function login(id text, pass text) returns auth.jwt_token as $$
declare
  _role name;
  result auth.jwt_token;
begin
  select auth.valid(id, pass) into _role;
  if _role is null then raise invalid_password using message = 'bad credential'; end if;
  select sign(row_to_json(r), current_setting('app.settings.jwt_secret')) as token from (
    select
      _role as role,
      login.id as id,
      extract(epoch from now())::integer + 3153600 as exp -- 365*24*60*60
  ) r into result;
  perform set_config('response.headers', '[{"Set-Cookie": "jwt='||result.token||'; Path=/; Max-Age=3153600; HttpOnly"},{"Set-Cookie": "id='|| url_encode(login.id::bytea) ||'; Path=/; Max-Age=3153600"},{"Set-Cookie": "role='|| url_encode(_role::bytea) ||'; Path=/; Max-Age=3153600"}]', true);
  return result;
end;
$$ language plpgsql security definer;
GRANT EXECUTE ON FUNCTION login TO "anon";

-- GET /rpc/signout endpoint
create or replace function logout() returns void as $$
begin
  perform set_config('response.headers', '[{"Set-Cookie": "jwt=0; Path=/;expires=Thu, 01 Jan 1970 00:00:01 GMT; HttpOnly"}, {"Set-Cookie": "id=0; Path=/;expires=Thu, 01 Jan 1970 00:00:01 GMT;"}, {"Set-Cookie": "role=0; Path=/;expires=Thu, 01 Jan 1970 00:00:01 GMT;"}]', true);
end;
$$ language plpgsql IMMUTABLE; -- IMMUTABLE can be GET
GRANT EXECUTE ON FUNCTION logout TO "user", "admin";
