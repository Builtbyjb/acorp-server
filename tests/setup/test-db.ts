import type { D1Database } from "@cloudflare/workers-types";

const MIGRATIONS = [
    `CREATE TABLE IF NOT EXISTS "users" (
        "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
        "email" text NOT NULL,
        "currency_organization_id" integer NOT NULL,
        "firstname" text,
        "lastname" text,
        "username" text NOT NULL,
        "avatar_url" text,
        "deleted" integer DEFAULT 0 NOT NULL,
        "created_at" integer DEFAULT (unixepoch()) NOT NULL,
        "updated_at" integer DEFAULT (unixepoch()) NOT NULL
    );`,
    `CREATE TABLE IF NOT EXISTS "organizations" (
        "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
        "name" text NOT NULL,
        "type" text NOT NULL,
        "address" text,
        "city" text,
        "country" text,
        "website" text,
        "logo_url" text,
        "invoice_number" text DEFAULT '{"currentNumber":0,"year":2000}' NOT NULL,
        "referral_code" text,
        "referred_by" integer,
        "referral_enabled" integer DEFAULT 0 NOT NULL,
        "total_earnings" integer DEFAULT 0 NOT NULL,
        "paystack_customer_code" text,
        "paystack_customer_id" integer,
        "paystack_plan_code" text,
        "paystack_plan_id" integer,
        "paystack_subscription_status" text DEFAULT 'none' NOT NULL,
        "payment_provider" text DEFAULT 'paystack' NOT NULL,
        "stripe_customer_id" text,
        "stripe_subscription_id" text,
        "stripe_plan_code" text,
        "stripe_plan_id" text,
        "stripe_subscription_status" text DEFAULT 'none' NOT NULL,
        "currency" text DEFAULT 'NGN' NOT NULL,
        "referral_payout_method" text,
        "deleted" integer DEFAULT 0 NOT NULL,
        "created_at" integer DEFAULT (unixepoch()) NOT NULL,
        "updated_at" integer DEFAULT (unixepoch()) NOT NULL
    );`,
    `CREATE TABLE IF NOT EXISTS "members" (
        "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
        "organization_id" integer NOT NULL,
        "user_id" integer NOT NULL,
        "role_id" integer NOT NULL,
        "start_date" integer DEFAULT (unixepoch()),
        "end_date" integer,
        "deleted" integer DEFAULT 0 NOT NULL,
        "created_at" integer DEFAULT (unixepoch()) NOT NULL,
        "updated_at" integer DEFAULT (unixepoch()) NOT NULL
    );`,
    `CREATE TABLE IF NOT EXISTS "roles" (
        "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
        "name" text NOT NULL,
        "permissions" text NOT NULL,
        "created_at" integer DEFAULT (unixepoch()) NOT NULL,
        "updated_at" integer DEFAULT (unixepoch()) NOT NULL
    );`,
    `CREATE TABLE IF NOT EXISTS "payouts" (
        "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
        "organization_id" integer NOT NULL,
        "amount" integer NOT NULL,
        "currency" text NOT NULL,
        "status" text DEFAULT 'pending' NOT NULL,
        "provider" text NOT NULL,
        "reference" text,
        "created_at" integer DEFAULT (unixepoch()) NOT NULL,
        "updated_at" integer DEFAULT (unixepoch()) NOT NULL
    );`,
    `CREATE TABLE IF NOT EXISTS "clients" (
        "id" text PRIMARY KEY NOT NULL,
        "organization_id" integer,
        "name" text NOT NULL,
        "email" text,
        "phone" text,
        "address" text,
        "city" text,
        "country" text,
        "deleted" integer DEFAULT 0 NOT NULL,
        "created_at" integer DEFAULT (unixepoch()) NOT NULL,
        "updated_at" integer DEFAULT (unixepoch()) NOT NULL
    );`,
    `CREATE TABLE IF NOT EXISTS "invoices" (
        "id" text PRIMARY KEY NOT NULL,
        "invoice_number" text NOT NULL,
        "client_id" text NOT NULL,
        "issue_date" integer NOT NULL,
        "due_date" integer NOT NULL,
        "status" text NOT NULL,
        "signature" text,
        "tax_rate" integer DEFAULT 0 NOT NULL,
        "discount" integer DEFAULT 0 NOT NULL,
        "items" text DEFAULT '[]' NOT NULL,
        "notes" text,
        "currency" text NOT NULL,
        "notified" integer DEFAULT 0 NOT NULL,
        "deleted" integer DEFAULT 0 NOT NULL,
        "created_at" integer DEFAULT (unixepoch()) NOT NULL,
        "updated_at" integer DEFAULT (unixepoch()) NOT NULL
    );`,
];

export async function migrateTestDb(db: D1Database) {
    for (const sql of MIGRATIONS) {
        try {
            await db.exec(sql);
        } catch (e: any) {
            if (e.message?.includes("already exists")) {
                continue;
            }
            throw e;
        }
    }
}

export async function clearTestDb(db: D1Database) {
    const tables = [
        "invoices",
        "clients",
        "payouts",
        "members",
        "users",
        "organizations",
        "roles",
    ];
    for (const table of tables) {
        try {
            await db.exec(`DELETE FROM ${table}`);
        } catch {
            // Table might not exist
        }
    }
}
