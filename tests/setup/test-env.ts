import type { Bindings } from "@/lib/types";
import Database from "better-sqlite3";

export function createMockRateLimiter() {
    return {
        limit: async () => ({ success: true }),
    } as any;
}

export function createMockEmail() {
    return {
        send: async () => ({ success: true }),
    } as any;
}

export function createMockR2() {
    const store = new Map<string, { body: Uint8Array; contentType: string }>();

    return {
        put: async (key: string, value: any, options?: any) => {
            const bytes = value instanceof Blob ? await value.arrayBuffer() : new TextEncoder().encode(value);
            store.set(key, { body: new Uint8Array(bytes), contentType: options?.httpMetadata?.contentType || "application/octet-stream" });
            return { key, httpEtag: `"${key}"` };
        },
        get: async (key: string) => {
            const item = store.get(key);
            if (!item) return null;
            return {
                body: item.body,
                httpEtag: `"${key}"`,
                writeHttpMetadata: (headers: Headers) => {
                    headers.set("content-type", item.contentType);
                },
            };
        },
    } as any;
}

function createBetterSqlite3D1() {
    const db = new Database(":memory:");

    // Create tables
    db.exec(`
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email TEXT NOT NULL UNIQUE,
            currency_organization_id INTEGER NOT NULL,
            firstname TEXT,
            lastname TEXT,
            username TEXT NOT NULL,
            avatar_url TEXT,
            deleted INTEGER NOT NULL DEFAULT 0,
            created_at INTEGER NOT NULL DEFAULT (unixepoch()),
            updated_at INTEGER NOT NULL DEFAULT (unixepoch())
        );
        CREATE TABLE IF NOT EXISTS organizations (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL UNIQUE,
            type TEXT NOT NULL,
            address TEXT,
            city TEXT,
            country TEXT,
            website TEXT,
            logo_url TEXT,
            invoice_number TEXT NOT NULL DEFAULT '{"currentNumber":0,"year":2000}',
            referral_code TEXT UNIQUE,
            referred_by INTEGER UNIQUE,
            referral_enabled INTEGER NOT NULL DEFAULT 0,
            total_earnings INTEGER NOT NULL DEFAULT 0,
            paystack_customer_code TEXT UNIQUE,
            paystack_customer_id INTEGER UNIQUE,
            paystack_plan_code TEXT,
            paystack_plan_id INTEGER,
            paystack_subscription_status TEXT NOT NULL DEFAULT 'none',
            payment_provider TEXT NOT NULL DEFAULT 'paystack',
            stripe_customer_id TEXT UNIQUE,
            stripe_subscription_id TEXT,
            stripe_plan_code TEXT,
            stripe_plan_id TEXT,
            stripe_subscription_status TEXT NOT NULL DEFAULT 'none',
            currency TEXT NOT NULL DEFAULT 'NGN',
            referral_payout_method TEXT,
            deleted INTEGER NOT NULL DEFAULT 0,
            created_at INTEGER NOT NULL DEFAULT (unixepoch()),
            updated_at INTEGER NOT NULL DEFAULT (unixepoch())
        );
        CREATE TABLE IF NOT EXISTS members (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            organization_id INTEGER NOT NULL,
            user_id INTEGER NOT NULL,
            role_id INTEGER NOT NULL,
            start_date INTEGER DEFAULT (unixepoch()),
            end_date INTEGER,
            deleted INTEGER NOT NULL DEFAULT 0,
            created_at INTEGER NOT NULL DEFAULT (unixepoch()),
            updated_at INTEGER NOT NULL DEFAULT (unixepoch())
        );
        CREATE TABLE IF NOT EXISTS roles (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL UNIQUE,
            permissions TEXT NOT NULL,
            created_at INTEGER NOT NULL DEFAULT (unixepoch()),
            updated_at INTEGER NOT NULL DEFAULT (unixepoch())
        );
        CREATE TABLE IF NOT EXISTS payouts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            organization_id INTEGER NOT NULL,
            amount INTEGER NOT NULL,
            currency TEXT NOT NULL,
            status TEXT NOT NULL DEFAULT 'pending',
            provider TEXT NOT NULL,
            reference TEXT,
            created_at INTEGER NOT NULL DEFAULT (unixepoch()),
            updated_at INTEGER NOT NULL DEFAULT (unixepoch())
        );
        CREATE TABLE IF NOT EXISTS clients (
            id TEXT PRIMARY KEY,
            organization_id INTEGER,
            name TEXT NOT NULL,
            email TEXT,
            phone TEXT,
            address TEXT,
            city TEXT,
            country TEXT,
            deleted INTEGER NOT NULL DEFAULT 0,
            created_at INTEGER NOT NULL DEFAULT (unixepoch()),
            updated_at INTEGER NOT NULL DEFAULT (unixepoch())
        );
        CREATE TABLE IF NOT EXISTS invoices (
            id TEXT PRIMARY KEY,
            invoice_number TEXT NOT NULL,
            client_id TEXT NOT NULL,
            issue_date INTEGER NOT NULL,
            due_date INTEGER NOT NULL,
            status TEXT NOT NULL,
            signature TEXT,
            tax_rate INTEGER NOT NULL DEFAULT 0,
            discount INTEGER NOT NULL DEFAULT 0,
            items TEXT NOT NULL DEFAULT '[]',
            notes TEXT,
            currency TEXT NOT NULL,
            notified INTEGER NOT NULL DEFAULT 0,
            deleted INTEGER NOT NULL DEFAULT 0,
            created_at INTEGER NOT NULL DEFAULT (unixepoch()),
            updated_at INTEGER NOT NULL DEFAULT (unixepoch())
        );
    `);

    return {
        prepare: (query: string) => {
            const stmt = db.prepare(query);
            return {
                bind: (...values: any[]) => {
                    const bound = stmt.bind(values);
                    return {
                        first: (colName?: string) => {
                            const row = bound.get();
                            if (!row) return null;
                            if (colName) return (row as any)[colName];
                            return row;
                        },
                        run: () => {
                            const info = bound.run();
                            return {
                                success: true,
                                meta: { last_row_id: info.lastInsertRowid, changes: info.changes },
                                results: [],
                            };
                        },
                        all: () => {
                            const rows = bound.all();
                            return {
                                success: true,
                                meta: { last_row_id: 0, changes: 0 },
                                results: rows,
                            };
                        },
                        raw: () => {
                            const rows = bound.raw().all();
                            return rows;
                        },
                    };
                },
                first: (colName?: string) => {
                    const row = stmt.get();
                    if (!row) return null;
                    if (colName) return (row as any)[colName];
                    return row;
                },
                run: () => {
                    const info = stmt.run();
                    return {
                        success: true,
                        meta: { last_row_id: info.lastInsertRowid, changes: info.changes },
                        results: [],
                    };
                },
                all: () => {
                    const rows = stmt.all();
                    return {
                        success: true,
                        meta: { last_row_id: 0, changes: 0 },
                        results: rows,
                    };
                },
                raw: () => {
                    const rows = stmt.raw().all();
                    return rows;
                },
            };
        },
        batch: (statements: any[]) => {
            return Promise.all(
                statements.map((s) => {
                    if (typeof s.run === "function") return s.run();
                    if (typeof s.all === "function") return s.all();
                    return s;
                }),
            );
        },
        exec: (query: string) => {
            db.exec(query);
            return Promise.resolve({ success: true, meta: { last_row_id: 0, changes: 0 } });
        },
        dump: () => Promise.resolve(new ArrayBuffer(0)),
    } as any;
}

export function createMockD1() {
    return createBetterSqlite3D1();
}

export function createMockEnv(): Bindings {
    return {
        DB: createMockD1(),
        R2: createMockR2(),
        SEND_EMAIL: createMockEmail(),
        RATE_LIMITER: createMockRateLimiter(),
        JWT_SECRET: "test-jwt-secret-for-unit-tests-only",
        OTP_EMAIL: "test@acorp.app",
        ENV: "dev",
        PAYSTACK_SECRET: "test-paystack-secret",
        STRIPE_SECRET_KEY: "test-stripe-secret",
        STRIPE_WEBHOOK_SECRET: "test-stripe-webhook-secret",
        STRIPE_PUBLISHABLE_KEY: "test-stripe-publishable",
        INVOICE_URL: "http://localhost:5173",
        SERVER_URL: "http://localhost:8585",
    };
}
