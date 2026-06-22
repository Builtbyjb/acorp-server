import { describe, it, expect, beforeEach } from "vitest";
import { createMockEnv } from "../setup/test-env";
import { migrateTestDb, clearTestDb } from "../setup/test-db";
import { createTestUser } from "../setup/test-factories";
import { setupMockFetch } from "../setup/fetch-mocks";
import { makeRequest, parseResponse } from "../setup/test-client";

describe("Payments E2E", () => {
    let env: ReturnType<typeof createMockEnv>;
    let restoreFetch: () => void;

    beforeEach(async () => {
        env = createMockEnv();
        restoreFetch = setupMockFetch();
        await migrateTestDb(env.DB);
        await clearTestDb(env.DB);
        // restoreFetch called in afterEach
    });

    afterEach(() => {
        restoreFetch();
    });

    describe("GET /api/v1/invoice/payments/plans (public)", () => {
        it("returns plans with free plan included", async () => {
            const res = await makeRequest(env, "GET", "/api/v1/invoice/payments/plans?provider=paystack");
            const { status, body } = await parseResponse(res);
            expect(status).toBe(200);
            expect(body.plans).toBeDefined();
            expect(body.plans.length).toBeGreaterThan(0);
            expect(body.plans[0].planCode).toBe("PLN_free");
        });

        it("returns only USD plans for stripe with currency=USD", async () => {
            const res = await makeRequest(env, "GET", "/api/v1/invoice/payments/plans?provider=stripe&currency=USD");
            const { status, body } = await parseResponse(res);
            expect(status).toBe(200);
            expect(body.plans).toBeDefined();
            expect(body.plans.length).toBe(3);
            expect(body.plans.every((p: any) => p.currency === "USD")).toBe(true);
            expect(body.plans.some((p: any) => p.planCode === "price_1ProUSD")).toBe(true);
            expect(body.plans.some((p: any) => p.planCode === "price_1TeamUSD")).toBe(true);
        });

        it("returns only CAD plans for stripe with currency=CAD", async () => {
            const res = await makeRequest(env, "GET", "/api/v1/invoice/payments/plans?provider=stripe&currency=CAD");
            const { status, body } = await parseResponse(res);
            expect(status).toBe(200);
            expect(body.plans).toBeDefined();
            expect(body.plans.length).toBe(3);
            expect(body.plans.every((p: any) => p.currency === "CAD")).toBe(true);
            expect(body.plans.some((p: any) => p.planCode === "price_1ProCAD")).toBe(true);
            expect(body.plans.some((p: any) => p.planCode === "price_1TeamCAD")).toBe(true);
        });

        it("defaults to USD for stripe when no currency is provided", async () => {
            const res = await makeRequest(env, "GET", "/api/v1/invoice/payments/plans?provider=stripe");
            const { status, body } = await parseResponse(res);
            expect(status).toBe(200);
            expect(body.plans).toBeDefined();
            expect(body.plans.every((p: any) => p.currency === "USD")).toBe(true);
        });
    });

    describe("GET /api/v1/invoice/payments/plans/me (protected)", () => {
        it("returns provider-aware plans for authenticated user", async () => {
            const { refreshToken } = await createTestUser(env.DB, env.JWT_SECRET, { paymentProvider: "paystack" });
            const res = await makeRequest(env, "GET", "/api/v1/invoice/payments/plans/me", {
                cookies: { refresh_token: refreshToken },
            });
            const { status, body } = await parseResponse(res);
            expect(status).toBe(200);
            expect(body.plans).toBeDefined();
        });

        it("returns organization currency plans for stripe user", async () => {
            const { refreshToken } = await createTestUser(env.DB, env.JWT_SECRET, {
                paymentProvider: "stripe",
                currency: "CAD",
            });
            const res = await makeRequest(env, "GET", "/api/v1/invoice/payments/plans/me", {
                cookies: { refresh_token: refreshToken },
            });
            const { status, body } = await parseResponse(res);
            expect(status).toBe(200);
            expect(body.plans).toBeDefined();
            expect(body.plans.every((p: any) => p.currency === "CAD")).toBe(true);
        });

        it("allows currency override via query param for authenticated user", async () => {
            const { refreshToken } = await createTestUser(env.DB, env.JWT_SECRET, {
                paymentProvider: "stripe",
                currency: "USD",
            });
            const res = await makeRequest(env, "GET", "/api/v1/invoice/payments/plans/me?currency=CAD", {
                cookies: { refresh_token: refreshToken },
            });
            const { status, body } = await parseResponse(res);
            expect(status).toBe(200);
            expect(body.plans).toBeDefined();
            expect(body.plans.every((p: any) => p.currency === "CAD")).toBe(true);
        });

        it("returns NGN plans for country=Nigeria with paystack user", async () => {
            const { refreshToken } = await createTestUser(env.DB, env.JWT_SECRET, {
                paymentProvider: "paystack",
                currency: "USD",
            });
            const res = await makeRequest(env, "GET", "/api/v1/invoice/payments/plans/me?country=Nigeria", {
                cookies: { refresh_token: refreshToken },
            });
            const { status, body } = await parseResponse(res);
            expect(status).toBe(200);
            expect(body.plans).toBeDefined();
            expect(body.plans.every((p: any) => p.currency === "NGN")).toBe(true);
        });

        it("returns CAD plans for country=Canada with stripe user", async () => {
            const { refreshToken } = await createTestUser(env.DB, env.JWT_SECRET, {
                paymentProvider: "stripe",
                currency: "USD",
            });
            const res = await makeRequest(env, "GET", "/api/v1/invoice/payments/plans/me?country=Canada", {
                cookies: { refresh_token: refreshToken },
            });
            const { status, body } = await parseResponse(res);
            expect(status).toBe(200);
            expect(body.plans).toBeDefined();
            expect(body.plans.every((p: any) => p.currency === "CAD")).toBe(true);
        });

        it("returns USD plans for country=USA with stripe user", async () => {
            const { refreshToken } = await createTestUser(env.DB, env.JWT_SECRET, {
                paymentProvider: "stripe",
                currency: "CAD",
            });
            const res = await makeRequest(env, "GET", "/api/v1/invoice/payments/plans/me?country=USA", {
                cookies: { refresh_token: refreshToken },
            });
            const { status, body } = await parseResponse(res);
            expect(status).toBe(200);
            expect(body.plans).toBeDefined();
            expect(body.plans.every((p: any) => p.currency === "USD")).toBe(true);
        });

        it("falls back to organization currency when country is unknown", async () => {
            const { refreshToken } = await createTestUser(env.DB, env.JWT_SECRET, {
                paymentProvider: "stripe",
                currency: "CAD",
            });
            const res = await makeRequest(env, "GET", "/api/v1/invoice/payments/plans/me?country=Unknown", {
                cookies: { refresh_token: refreshToken },
            });
            const { status, body } = await parseResponse(res);
            expect(status).toBe(200);
            expect(body.plans).toBeDefined();
            expect(body.plans.every((p: any) => p.currency === "CAD")).toBe(true);
        });

        it("gives explicit currency precedence over country", async () => {
            const { refreshToken } = await createTestUser(env.DB, env.JWT_SECRET, {
                paymentProvider: "stripe",
                currency: "USD",
            });
            const res = await makeRequest(env, "GET", "/api/v1/invoice/payments/plans/me?country=Nigeria&currency=CAD", {
                cookies: { refresh_token: refreshToken },
            });
            const { status, body } = await parseResponse(res);
            expect(status).toBe(200);
            expect(body.plans).toBeDefined();
            expect(body.plans.every((p: any) => p.currency === "CAD")).toBe(true);
        });

        it("switches provider to stripe for Canada even when org is paystack", async () => {
            const { refreshToken } = await createTestUser(env.DB, env.JWT_SECRET, {
                paymentProvider: "paystack",
                currency: "NGN",
            });
            const res = await makeRequest(env, "GET", "/api/v1/invoice/payments/plans/me?country=Canada", {
                cookies: { refresh_token: refreshToken },
            });
            const { status, body } = await parseResponse(res);
            expect(status).toBe(200);
            expect(body.plans).toBeDefined();
            expect(body.plans.every((p: any) => p.currency === "CAD")).toBe(true);
            expect(body.plans.some((p: any) => p.planCode.startsWith("price_"))).toBe(true);
        });
    });

    describe("POST /api/v1/invoice/payments/subscribe", () => {
        it("returns 400 for already active subscription", async () => {
            const { refreshToken } = await createTestUser(env.DB, env.JWT_SECRET, {
                paystackCustomerId: 12345,
                paystackSubscriptionStatus: "active",
            });
            const res = await makeRequest(env, "POST", "/api/v1/invoice/payments/subscribe", {
                body: { planCode: "PLN_test" },
                cookies: { refresh_token: refreshToken },
            });
            const { status, body } = await parseResponse(res);
            expect(status).toBe(400);
            expect(body.message).toBe("You already have an active subscription");
        });
    });

    describe("GET /api/v1/invoice/payments/subscriptions", () => {
        it("returns subscriptions for authenticated user", async () => {
            const { refreshToken } = await createTestUser(env.DB, env.JWT_SECRET, {
                paystackCustomerId: 12345,
            });
            const res = await makeRequest(env, "GET", "/api/v1/invoice/payments/subscriptions", {
                cookies: { refresh_token: refreshToken },
            });
            const { status, body } = await parseResponse(res);
            expect(status).toBe(200);
            expect(body.data).toBeDefined();
        });
    });

    describe("POST /api/v1/invoice/payments/subscription/disable", () => {
        it("cancels subscription and updates status", async () => {
            const { refreshToken } = await createTestUser(env.DB, env.JWT_SECRET, {
                paystackCustomerId: 12345,
                paystackSubscriptionStatus: "active",
            });
            const res = await makeRequest(env, "POST", "/api/v1/invoice/payments/subscription/disable", {
                body: { subscriptionCode: "SUB_test", emailToken: "token_test" },
                cookies: { refresh_token: refreshToken },
            });
            const { status, body } = await parseResponse(res);
            expect(status).toBe(200);
            expect(body.message).toBe("Subscription cancelled");
        });
    });

    describe("POST /api/v1/invoice/payments/subscription/update", () => {
        it("returns update link for subscription", async () => {
            const { refreshToken } = await createTestUser(env.DB, env.JWT_SECRET, {
                paystackCustomerId: 12345,
            });
            const res = await makeRequest(env, "POST", "/api/v1/invoice/payments/subscription/update", {
                body: { subscriptionCode: "SUB_test", emailToken: "token_test" },
                cookies: { refresh_token: refreshToken },
            });
            const { status, body } = await parseResponse(res);
            expect(status).toBe(200);
            expect(body.updateLink).toBeDefined();
        });
    });
});
