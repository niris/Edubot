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
SELECT id, alias, progress, theme
FROM public.profile;
grant SELECT ON TABLE public.leaderboard TO "anon";
grant SELECT ON TABLE public.leaderboard TO "user";

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
	if _exist is null then raise invalid_password using message = 'ใส่ข้อมูลคำถามเพื่อความปลอดภัยไม่ถูกต้อง'; end if;
	update auth.users set pass = reset.pass where users.id = reset.id;
	return null;
end;
$$ language plpgsql security definer;
GRANT EXECUTE ON FUNCTION reset TO "anon";

create domain "text/html" as text;

create or replace function html_header() returns text as $$
select $html$
<!DOCTYPE html>
<html lang="en">
<meta charset="utf-8">
<title>CYP - Check Your Protection</title>
<meta name="viewport" content="width=device-width/2, initial-scale=2">
<meta name="description" content="Check Your Protection">
<meta name="color-scheme" content="dark light">
<link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 8 8'><path d='M0,8L0,0L8,0L8,8M1,1L1,7L7,7L7,1M4,6L2,4L3,4L4,5L7,2L7,3'></path></svg>" type="image/svg+xml">
<!--link href="/static/style.css" rel="stylesheet" /-->
<nav>
	<b><input type=checkbox checked aria-label="logo"><a href="/">CYP</a></b>
	—<a href="/auth">auth</a>
	•<a href="/probes">probes</a>
	•<a href="/reports">reports</a>
</nav>
$html$;
$$ language sql;
GRANT EXECUTE ON FUNCTION html_header TO "anon";

create or replace function auth() returns "text/html" as $$
	select html_header() || $html$
	<p>
	<form action="/login" method="POST">
	<input name="id" aria-label="username">
	<input name="pass" type="password" aria-label="password">
	<button>login</button>
	</form>
	</p>
	<p>
	<form action="/register" method="POST">
	<input name="id" aria-label="username">
	<input name="pass" type="password" aria-label="password">
	<button>register</button>
	</form>
	</p>
	$html$;
$$ language sql;
GRANT EXECUTE ON FUNCTION auth TO "anon";

create or replace function index() returns "text/html" as $$
	select html_header() || $html$
	<main>
	<article>Argument 1</article>
	<article>Argument 2</article>
	</main>
	$html$;
$$ language sql;
GRANT EXECUTE ON FUNCTION index TO "anon";

NOTIFY pgrst, 'reload schema';
