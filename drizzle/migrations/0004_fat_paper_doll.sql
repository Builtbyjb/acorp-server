ALTER TABLE `organizations` ADD `referral_code` text;--> statement-breakpoint
ALTER TABLE `organizations` ADD `referred_by` integer;--> statement-breakpoint
ALTER TABLE `organizations` ADD `referral_enabled` integer DEFAULT false NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX `organizations_referral_code_unique` ON `organizations` (`referral_code`);--> statement-breakpoint
CREATE UNIQUE INDEX `organizations_referred_by_unique` ON `organizations` (`referred_by`);