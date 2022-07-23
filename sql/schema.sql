-- prevent created FUNCTION to be public by default

ALTER DEFAULT PRIVILEGES REVOKE EXECUTE ON FUNCTIONS FROM PUBLIC;
-- auth table + roles (anon, admin, user)
\ir _auth.sql
-- auth rpc (/rpc/login, /rpc/register, /rpc/logout)
\ir _auth_jwt.sql

DROP TABLE IF EXISTS public.lesson;
CREATE TABLE public.lesson (
	"id" int GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY, -- SERIAL type would've required a "sequence" table
	"draft" boolean DEFAULT FALSE,
	"title" text,
	"icon" varchar,
	"tags" varchar[],
	"created" timestamp NOT NULL DEFAULT NOW(),
	"content" text,
	"owner" name DEFAULT current_setting('request.jwt.claims', true)::json->>'id' REFERENCES auth.users(id) ON DELETE CASCADE
);
grant SELECT ON TABLE public.lesson TO "user", "anon";
grant ALL    ON TABLE public.lesson TO "admin";
ALTER TABLE public.lesson ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "lesson_policy" ON public.lesson;
CREATE POLICY "lesson_policy" ON public.lesson
  USING (("draft" = FALSE) OR ("owner" = current_setting('request.jwt.claims', true)::json->>'id')) -- visibility rule
  WITH CHECK ("owner" = current_setting('request.jwt.claims', true)::json->>'id'); -- mutation rule

DROP TABLE IF EXISTS public.profile;
CREATE TABLE public.profile (
	"id" name DEFAULT current_setting('request.jwt.claims', true)::json->>'id' PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
	"firstname" text,
	"lastname" text,
	"alias" text,
	"birth" date,
	"grade" integer,
	"progress" JSON -- cleared lessons/exams
);

CREATE or replace FUNCTION auth.also_create_profile() returns trigger as $$
begin
	INSERT into public.profile("id", "progress") VALUES (NEW.id, '{}');
	RETURN NEW;
end
$$ language plpgsql;
DROP TRIGGER IF EXISTS setup_profile ON auth.users;
CREATE TRIGGER setup_profile AFTER INSERT ON auth.users FOR EACH ROW EXECUTE PROCEDURE auth.also_create_profile();

grant SELECT ON TABLE public.profile TO "anon";
grant ALL    ON TABLE public.profile TO "user", "admin";
ALTER TABLE public.profile ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "user_policy" ON public.profile;
CREATE POLICY "user_policy" ON public.profile
  USING ("id" = current_setting('request.jwt.claims', true)::json->>'id') -- visibility rule
  WITH CHECK ("id" = current_setting('request.jwt.claims', true)::json->>'id'); -- mutation rule

-- debug dataset for role debugging
insert into auth.users ("id","pass","role") values ('teacher','teacher','admin') ON CONFLICT DO NOTHING;
insert into auth.users ("id","pass","role") values ('student','student','user' ) ON CONFLICT DO NOTHING;
insert into auth.users ("id","pass","role") values ('bigboss','bigboss','root' ) ON CONFLICT DO NOTHING;
--do not deploy dataset as we want to see the empty lesson page by default
--insert into public.lesson ("title","draft","owner") values ('public',FALSE,'admin') ON CONFLICT DO NOTHING;
--insert into public.lesson ("title","draft","owner") values ('draft',TRUE,'admin') ON CONFLICT DO NOTHING;
-- CREATE VIEW u AS SELECT "id", "role", "progress" FROM auth.users;

NOTIFY pgrst, 'reload schema';