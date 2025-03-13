CREATE TABLE IF NOT EXISTS "buyables" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"price" real NOT NULL,
	"category" text NOT NULL,
	"stock" integer DEFAULT 0 NOT NULL,
	"deleted" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "transactions" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"amount" real NOT NULL,
	"item" integer,
	"type" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"username" text NOT NULL,
	"password" text NOT NULL,
	"balance" real DEFAULT 0 NOT NULL,
	"is_admin" boolean DEFAULT false NOT NULL,
	"achievements" text DEFAULT '[]' NOT NULL,
	CONSTRAINT "users_username_unique" UNIQUE("username")
);


INSERT INTO "users" ("username", "password", "balance", "is_admin", "achievements")
VALUES ('admin', 'bc26ab1c7734c445ae10a6531519b2fdae561e65d729104ecbef719ee8aa3c3431ead4e6c4530b9c4bb4443696d2032029cfda66e6a8b021f79b7e4af58a0bc8.00c7ab5a06f524966640d0abb96d3947', 0, true, '[]');


INSERT INTO "buyables" ("name", "price", "category", "stock", "deleted")
VALUES ('Bier', 1.0, 'Alkohol', 0, false),
       ('Softdrink', 1.00, 'Anti-Alkohol', 0, false),
       ('Wein', 4.00, 'Alkohol', 0, false);