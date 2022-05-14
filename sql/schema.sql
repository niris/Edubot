-- auth table definition
\ir _auth.sql
-- auth JWT-related function (/rpc/login, /rpc/register, /rpc/logout)
\ir _auth_jwt.sql

DROP TABLE IF EXISTS "lesson";
CREATE TABLE "lesson" (
	"id" SERIAL PRIMARY KEY,
	"title" text,
	"tags" varchar[],
	"created" timestamp NOT NULL DEFAULT NOW(),
	"content" text,
	"owner" varchar NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE
);

-- we can now safely add our users/roles
grant SELECT ON TABLE "lesson" TO student;
grant ALL    ON TABLE "lesson" TO teacher;

insert into auth.users ("id","pass","role") values ('admin','admin','teacher') ON CONFLICT DO NOTHING;

NOTIFY pgrst, 'reload schema'