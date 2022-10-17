-- prevent created FUNCTION to be public by default

ALTER DEFAULT PRIVILEGES REVOKE EXECUTE ON FUNCTIONS FROM PUBLIC;
-- auth table + roles (anon, user)
\ir _auth.sql
-- auth rpc (/rpc/login, /rpc/register, /rpc/logout)
\ir _auth_jwt.sql

DROP TABLE IF EXISTS public.profile;
CREATE TABLE public.profile (
	"id" name DEFAULT current_setting('request.jwt.claims', true)::json->>'id' PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
	"alias" text,
	"birth" date,
	"secret" text, -- favorite food
	"theme" text DEFAULT '', -- empty so frontend can fallback
	"progress" JSON -- cleared lessons/exams
);

CREATE or replace VIEW public.leaderboard AS
SELECT id, alias, progress
FROM public.profile;
grant SELECT ON TABLE public.leaderboard TO "anon";

CREATE or replace FUNCTION auth.also_create_profile() returns trigger as $$
begin
	INSERT into public.profile("id", "progress") VALUES (NEW.id, '{}');
	RETURN NEW;
end
$$ language plpgsql;
DROP TRIGGER IF EXISTS setup_profile ON auth.users;
CREATE TRIGGER setup_profile AFTER INSERT ON auth.users FOR EACH ROW EXECUTE PROCEDURE auth.also_create_profile();

-- We dont want user to be able to see each other:
GRANT SELECT ON TABLE public.profile TO "anon";
GRANT ALL    ON TABLE public.profile TO "user";
ALTER TABLE public.profile ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "user_policy" ON public.profile;
CREATE POLICY "user_policy" ON public.profile
  USING ("id" = current_setting('request.jwt.claims', true)::json->>'id') -- visibility rule
  WITH CHECK ("id" = current_setting('request.jwt.claims', true)::json->>'id'); -- mutation rule

-- POST /rpc/reset endpoint
create or replace function reset(id text, pass text, birth text, secret text) returns text as $$
declare
	_exist name;
begin
	select profile.id from public.profile
	where  profile.id = reset.id and profile.birth = reset.birth::DATE and profile.secret = reset.secret
	into _exist;
	if _exist is null then raise invalid_password using message = 'bad informations'; end if;
	update auth.users set pass = reset.pass where users.id = reset.id;
	return null;
end;
$$ language plpgsql security definer;
GRANT EXECUTE ON FUNCTION reset TO "anon";

NOTIFY pgrst, 'reload schema';
