ALTER TABLE `organizations` ADD COLUMN `payment_provider` text NOT NULL DEFAULT 'paystack';
ALTER TABLE `organizations` ADD COLUMN `stripe_customer_id` text;
ALTER TABLE `organizations` ADD COLUMN `stripe_subscription_id` text;
ALTER TABLE `organizations` ADD COLUMN `stripe_plan_code` text;
ALTER TABLE `organizations` ADD COLUMN `stripe_plan_id` text;
ALTER TABLE `organizations` ADD COLUMN `stripe_subscription_status` text NOT NULL DEFAULT 'none';
ALTER TABLE `organizations` ADD COLUMN `currency` text NOT NULL DEFAULT 'NGN';
ALTER TABLE `organizations` ADD COLUMN `referral_payout_method` text;

DROP INDEX IF EXISTS `organizations_paystack_customer_code_unique`;
DROP INDEX IF EXISTS `organizations_paystack_customer_id_unique`;

ALTER TABLE `organizations` ADD COLUMN `paystack_customer_code_new` text;
UPDATE `organizations` SET `paystack_customer_code_new` = `paystack_customer_code`;
ALTER TABLE `organizations` DROP COLUMN `paystack_customer_code`;
ALTER TABLE `organizations` RENAME COLUMN `paystack_customer_code_new` TO `paystack_customer_code`;

ALTER TABLE `organizations` ADD COLUMN `paystack_customer_id_new` integer;
UPDATE `organizations` SET `paystack_customer_id_new` = `paystack_customer_id`;
ALTER TABLE `organizations` DROP COLUMN `paystack_customer_id`;
ALTER TABLE `organizations` RENAME COLUMN `paystack_customer_id_new` TO `paystack_customer_id`;

CREATE UNIQUE INDEX `organizations_paystack_customer_code_unique` ON `organizations` (`paystack_customer_code`);
CREATE UNIQUE INDEX `organizations_paystack_customer_id_unique` ON `organizations` (`paystack_customer_id`);
CREATE UNIQUE INDEX `organizations_stripe_customer_id_unique` ON `organizations` (`stripe_customer_id`);

CREATE TABLE `payouts` (
    `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
    `organization_id` integer NOT NULL,
    `amount` integer NOT NULL,
    `currency` text NOT NULL,
    `status` text DEFAULT 'pending' NOT NULL,
    `provider` text NOT NULL,
    `reference` text,
    `created_at` integer DEFAULT (unixepoch()) NOT NULL,
    `updated_at` integer DEFAULT (unixepoch()) NOT NULL,
    FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON UPDATE no action ON DELETE no action
);
