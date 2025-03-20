CREATE TABLE "buyables" (
                            "id" serial PRIMARY KEY NOT NULL,
                            "name" text NOT NULL,
                            "price" real NOT NULL,
                            "category" text NOT NULL,
                            "stock" integer DEFAULT 0 NOT NULL,
                            "deleted" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "group_members" (
                                 "group_id" integer NOT NULL,
                                 "user_id" integer NOT NULL,
                                 "status" text DEFAULT 'invited' NOT NULL,
                                 CONSTRAINT "group_members_group_id_user_id_pk" PRIMARY KEY("group_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "groups" (
                          "id" serial PRIMARY KEY NOT NULL,
                          "name" text NOT NULL,
                          CONSTRAINT "groups_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "transactions" (
                                "id" serial PRIMARY KEY NOT NULL,
                                "user_id" integer NOT NULL,
                                "amount" real NOT NULL,
                                "item" integer,
                                "type" text NOT NULL,
                                "group_id" integer,
                                "is_jackpot" boolean DEFAULT false NOT NULL,
                                "created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
                         "id" serial PRIMARY KEY NOT NULL,
                         "username" text NOT NULL,
                         "password" text NOT NULL,
                         "balance" real DEFAULT 0 NOT NULL,
                         "is_admin" boolean DEFAULT false NOT NULL,
                         "achievements" text DEFAULT '[]' NOT NULL,
                         CONSTRAINT "users_username_unique" UNIQUE("username")
);
--> statement-breakpoint
ALTER TABLE "group_members" ADD CONSTRAINT "group_members_group_id_groups_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."groups"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "group_members" ADD CONSTRAINT "group_members_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;

INSERT INTO "users" ("username", "password", "balance", "is_admin", "achievements")
VALUES ('admin', 'bc26ab1c7734c445ae10a6531519b2fdae561e65d729104ecbef719ee8aa3c3431ead4e6c4530b9c4bb4443696d2032029cfda66e6a8b021f79b7e4af58a0bc8.00c7ab5a06f524966640d0abb96d3947', 0, true, '[]');


INSERT INTO "buyables" ("name", "price", "category", "stock", "deleted")
VALUES ('Bier', 1.0, 'alcohol', 20, false),
       ('Softdrink', 1.00, 'softdrink', 20, false),
       ('Wein', 4.00, 'alcohol', 12, false);