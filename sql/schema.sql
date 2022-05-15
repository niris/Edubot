-- prevent created FUNCTION to be public
ALTER DEFAULT PRIVILEGES REVOKE EXECUTE ON FUNCTIONS FROM PUBLIC;
-- auth table + roles (anon, admin, user)
\ir _auth.sql
-- auth JWT-related function (/rpc/login, /rpc/register, /rpc/logout)
\ir _auth_jwt.sql

DROP TABLE IF EXISTS "lesson";
CREATE TABLE "lesson" (
	"id" SERIAL PRIMARY KEY,
	"draft" boolean DEFAULT FALSE,
	"title" text,
	"tags" varchar[],
	"created" timestamp NOT NULL DEFAULT NOW(),
	"content" text,
	"owner" name DEFAULT current_user REFERENCES auth.users(id) ON DELETE CASCADE
);
ALTER TABLE "lesson" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "lesson_policy" ON "lesson"
  USING (("draft" = FALSE) OR ("owner" = current_user)) -- visibility
  WITH CHECK ("owner" = current_user); -- mutation
-- we can now safely add our users/roles
grant SELECT ON TABLE "lesson" TO "user";
grant ALL    ON TABLE "lesson" TO "admin";

-- await (await fetch('/api/lesson', {method:'POST', body: new URLSearchParams({title:'test'})})).json()
insert into auth.users ("id","pass","role") values ('admin','admin','admin') ON CONFLICT DO NOTHING;
insert into auth.users ("id","pass","role") values ('user' ,'user' ,'user' ) ON CONFLICT DO NOTHING;
insert into lesson ("title","draft","owner") values ('public',FALSE,'admin') ON CONFLICT DO NOTHING;
insert into lesson ("title","draft","owner") values ('draft',TRUE,'admin') ON CONFLICT DO NOTHING;

NOTIFY pgrst, 'reload schema';