CREATE TABLE "app_users" (
	"username" text PRIMARY KEY NOT NULL,
	"password_hash" text NOT NULL,
	"display_name" text NOT NULL,
	"role" text DEFAULT 'user' NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
INSERT INTO "app_users" ("username", "password_hash", "display_name", "role", "active")
VALUES (
  'admin',
  'scrypt$16384$8$1$cHJvZGUtNDA0LWFkbWlu$KK4IbztNnUtn0hzkxTZjGGhFESKo17dk2rgxQwIkgGrixB41MmfyfYte-TAR7XmoE7ekRYW0YxpXAmQ1rLsNcA',
  'Admin',
  'admin',
  true
);
