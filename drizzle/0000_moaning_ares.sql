CREATE TABLE `challenges` (
	`id` text PRIMARY KEY NOT NULL,
	`address` text NOT NULL,
	`message` text NOT NULL,
	`expires_at` integer NOT NULL,
	`consumed` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE `checks` (
	`id` text PRIMARY KEY NOT NULL,
	`owner` text NOT NULL,
	`claim` text NOT NULL,
	`source` text NOT NULL,
	`visibility` text NOT NULL,
	`topic` text NOT NULL,
	`payload` text NOT NULL,
	`input_hash` text NOT NULL,
	`contract` text NOT NULL,
	`created_at` integer NOT NULL,
	`state` text DEFAULT 'draft' NOT NULL,
	`evm_hash` text,
	`gen_hash` text,
	`verdict` text,
	`result` text,
	`error` text,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `checks_owner` ON `checks` (`owner`,`created_at`);--> statement-breakpoint
CREATE INDEX `checks_public` ON `checks` (`visibility`,`created_at`);--> statement-breakpoint
CREATE TABLE `limits` (
	`key` text PRIMARY KEY NOT NULL,
	`count` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `sessions` (
	`hash` text PRIMARY KEY NOT NULL,
	`address` text NOT NULL,
	`expires_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `users` (
	`address` text PRIMARY KEY NOT NULL,
	`username` text,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_username_unique` ON `users` (`username`);