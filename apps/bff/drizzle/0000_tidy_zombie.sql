CREATE TABLE `broker_connections` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`broker_id` text NOT NULL,
	`status` text DEFAULT 'active' NOT NULL,
	`authorized_at` text DEFAULT (datetime('now')) NOT NULL,
	`expires_at` text,
	`last_refresh_at` text,
	`consecutive_failures` integer DEFAULT 0 NOT NULL,
	`last_error_code` text,
	`last_error_message` text,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	`updated_at` text DEFAULT (datetime('now')) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`broker_id`) REFERENCES `brokers`(`id`) ON UPDATE no action ON DELETE restrict
);
--> statement-breakpoint
CREATE TABLE `brokers` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`name_zh` text NOT NULL,
	`logo_url` text NOT NULL,
	`default_currency` text(3) NOT NULL,
	`supported` integer DEFAULT true NOT NULL,
	`adapter_version` text NOT NULL,
	`requires_verification` integer DEFAULT false NOT NULL,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	`updated_at` text DEFAULT (datetime('now')) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `exchange_rates` (
	`id` text PRIMARY KEY NOT NULL,
	`base_currency` text(3) NOT NULL,
	`target_currency` text(3) NOT NULL,
	`rate` text NOT NULL,
	`rate_date` text NOT NULL,
	`fetched_at` text DEFAULT (datetime('now')) NOT NULL,
	`source` text NOT NULL,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	`updated_at` text DEFAULT (datetime('now')) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`email_verified` integer DEFAULT false NOT NULL,
	`password_hash` text,
	`display_name` text,
	`locale` text DEFAULT 'en' NOT NULL,
	`display_currency` text(3) DEFAULT 'USD' NOT NULL,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	`updated_at` text DEFAULT (datetime('now')) NOT NULL,
	`last_login_at` text
);
--> statement-breakpoint
CREATE INDEX `idx_user_broker` ON `broker_connections` (`user_id`,`broker_id`);--> statement-breakpoint
CREATE INDEX `idx_currency_date` ON `exchange_rates` (`base_currency`,`target_currency`,`rate_date`);--> statement-breakpoint
CREATE INDEX `idx_rate_date` ON `exchange_rates` (`rate_date`);--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);