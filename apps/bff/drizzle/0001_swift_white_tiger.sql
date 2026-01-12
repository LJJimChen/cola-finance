CREATE TABLE `authorization_tasks` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`broker_id` text NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`state_snapshot` text NOT NULL,
	`verification_url` text,
	`verification_type` text,
	`connection_id` text,
	`error_code` text,
	`error_message` text,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	`updated_at` text DEFAULT (datetime('now')) NOT NULL,
	`expires_at` text NOT NULL,
	`completed_at` text,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`broker_id`) REFERENCES `brokers`(`id`) ON UPDATE no action ON DELETE restrict,
	FOREIGN KEY (`connection_id`) REFERENCES `broker_connections`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE TABLE `classification_schemes` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text,
	`name` text NOT NULL,
	`name_zh` text,
	`description` text,
	`is_preset` integer DEFAULT false NOT NULL,
	`categories` text NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `collection_tasks` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`connection_id` text NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`state_snapshot` text NOT NULL,
	`holdings_collected` integer DEFAULT 0 NOT NULL,
	`holdings_failed` integer DEFAULT 0 NOT NULL,
	`partial_reason` text,
	`error_code` text,
	`error_message` text,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	`updated_at` text DEFAULT (datetime('now')) NOT NULL,
	`completed_at` text,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`connection_id`) REFERENCES `broker_connections`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `holding_snapshots` (
	`id` text PRIMARY KEY NOT NULL,
	`holding_id` text NOT NULL,
	`user_id` text NOT NULL,
	`quantity` text NOT NULL,
	`market_value` text NOT NULL,
	`cost_basis` text,
	`currency` text(3) NOT NULL,
	`snapshot_at` text NOT NULL,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	FOREIGN KEY (`holding_id`) REFERENCES `holdings`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `holdings` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`connection_id` text NOT NULL,
	`symbol` text NOT NULL,
	`instrument_type` text NOT NULL,
	`instrument_name` text NOT NULL,
	`instrument_name_zh` text,
	`quantity` text NOT NULL,
	`currency` text(3) NOT NULL,
	`market_value` text NOT NULL,
	`cost_basis` text,
	`unrealized_pnl` text,
	`daily_return` text,
	`total_return` text,
	`category` text,
	`last_updated_at` text NOT NULL,
	`is_stale` integer DEFAULT false NOT NULL,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	`updated_at` text DEFAULT (datetime('now')) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`connection_id`) REFERENCES `broker_connections`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `rebalance_previews` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`scheme_id` text NOT NULL,
	`target_id` text NOT NULL,
	`current_allocation` text NOT NULL,
	`drift` text NOT NULL,
	`adjustments` text NOT NULL,
	`portfolio_value` text NOT NULL,
	`display_currency` text NOT NULL,
	`computed_at` text NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`scheme_id`) REFERENCES `classification_schemes`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`target_id`) REFERENCES `target_allocations`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `target_allocations` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`scheme_id` text NOT NULL,
	`targets` text NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`scheme_id`) REFERENCES `classification_schemes`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_auth_tasks_status` ON `authorization_tasks` (`status`);--> statement-breakpoint
CREATE INDEX `idx_auth_tasks_expires` ON `authorization_tasks` (`expires_at`);--> statement-breakpoint
CREATE INDEX `idx_auth_tasks_user_broker` ON `authorization_tasks` (`user_id`,`broker_id`);--> statement-breakpoint
CREATE INDEX `idx_classification_schemes_is_preset` ON `classification_schemes` (`is_preset`);--> statement-breakpoint
CREATE INDEX `idx_classification_schemes_user_id` ON `classification_schemes` (`user_id`);--> statement-breakpoint
CREATE INDEX `idx_collection_tasks_status` ON `collection_tasks` (`status`);--> statement-breakpoint
CREATE INDEX `idx_collection_tasks_user_created` ON `collection_tasks` (`user_id`,`created_at`);--> statement-breakpoint
CREATE INDEX `idx_holding_snapshot` ON `holding_snapshots` (`holding_id`,`snapshot_at`);--> statement-breakpoint
CREATE INDEX `idx_user_snapshot` ON `holding_snapshots` (`user_id`,`snapshot_at`);--> statement-breakpoint
CREATE INDEX `idx_holdings_user_symbol` ON `holdings` (`user_id`,`symbol`);--> statement-breakpoint
CREATE INDEX `idx_holdings_user_category` ON `holdings` (`user_id`,`category`);--> statement-breakpoint
CREATE INDEX `idx_holdings_connection` ON `holdings` (`connection_id`);--> statement-breakpoint
CREATE INDEX `idx_rebalance_previews_user_id` ON `rebalance_previews` (`user_id`);--> statement-breakpoint
CREATE INDEX `idx_rebalance_previews_computed_at_desc` ON `rebalance_previews` (`computed_at`);--> statement-breakpoint
CREATE INDEX `idx_rebalance_previews_user_scheme` ON `rebalance_previews` (`user_id`,`scheme_id`);--> statement-breakpoint
CREATE INDEX `idx_target_allocations_user_id` ON `target_allocations` (`user_id`);--> statement-breakpoint
CREATE INDEX `idx_target_allocations_scheme_id` ON `target_allocations` (`scheme_id`);--> statement-breakpoint
CREATE INDEX `idx_target_allocations_user_scheme_unique` ON `target_allocations` (`user_id`,`scheme_id`);