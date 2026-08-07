CREATE TABLE `categories` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`company_id` integer,
	`parent_id` integer,
	`name` text NOT NULL,
	`description` text,
	`status` text DEFAULT 'active' NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON UPDATE no action ON DELETE no action
);

ALTER TABLE `products` ADD COLUMN `category_id` integer REFERENCES `categories`(`id`);
ALTER TABLE `products` ADD COLUMN `type` text DEFAULT 'finished_good' NOT NULL;
ALTER TABLE `products` ADD COLUMN `base_unit` text DEFAULT 'u' NOT NULL;
ALTER TABLE `products` ADD COLUMN `cost` real DEFAULT 0 NOT NULL;
ALTER TABLE `products` ADD COLUMN `price` real DEFAULT 0 NOT NULL;
