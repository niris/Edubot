DROP TABLE IF EXISTS "file";
DROP TABLE IF EXISTS "lesson";
DROP TABLE IF EXISTS "user";

-- opaque progress state
CREATE TABLE "user" (
	"id" varchar PRIMARY KEY,
	"roles" varchar[],
	"secret" varchar, -- hash(salted+password)
	"progress" JSONB[]
);

CREATE TABLE "lesson" (
	"id" SERIAL PRIMARY KEY,
	"title" text,
	"tags" varchar[],
	"created" timestamp NOT NULL DEFAULT NOW(),
	"content" text,
	"owner" varchar NOT NULL REFERENCES "user"(id) ON DELETE CASCADE
);
-- assets used in lessons (mp3, jpg, ...)
-- CREATE TABLE "file" (
-- 	"id" SERIAL PRIMARY KEY,
-- 	"mime" varchar NOT NULL,
-- 	"content" bytea NOT NULL,
-- 	"title" text,
-- 	"created" timestamp NOT NULL DEFAULT NOW(),
-- 	"lesson" INTEGER NOT NULL REFERENCES "lesson"(id) ON DELETE CASCADE
-- );
