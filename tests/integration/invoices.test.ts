import { describe, it, expect, beforeEach } from "vitest";
import { createMockEnv } from "../setup/test-env";
import { migrateTestDb, clearTestDb } from "../setup/test-db";
import { createTestUser, createTestClient, createTestInvoice } from "../setup/test-factories";
import { setupMockFetch } from "../setup/fetch-mocks";
import { makeRequest, parseResponse } from "../setup/test-client";

describe("Invoices E2E", () => {
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

    describe("GET /api/v1/invoice/invoices", () => {
        it("returns paginated invoices for authenticated user", async () => {
            const { refreshToken } = await createTestUser(env.DB, env.JWT_SECRET);
            const res = await makeRequest(env, "GET", "/api/v1/invoice/invoices", {
                cookies: { refresh_token: refreshToken },
            });
            const { status, body } = await parseResponse(res);
            expect(status).toBe(200);
            expect(body.message).toBe("Invoices fetched");
            expect(body.invoices).toBeDefined();
        });
    });

    describe("GET /api/v1/invoice/clients/:clientId/invoices", () => {
        it("returns invoices for a client", async () => {
            const { org, refreshToken } = await createTestUser(env.DB, env.JWT_SECRET);
            const { client } = await createTestClient(env.DB, org.id);
            const res = await makeRequest(env, "GET", `/api/v1/invoice/clients/${client.id}/invoices`, {
                cookies: { refresh_token: refreshToken },
            });
            const { status, body } = await parseResponse(res);
            expect(status).toBe(200);
            expect(body.message).toBe("All Invoices");
        });
    });

    describe("GET /api/v1/invoice/clients/:clientId/invoices/:invoiceId", () => {
        it("returns single invoice details", async () => {
            const { org, refreshToken } = await createTestUser(env.DB, env.JWT_SECRET);
            const { client } = await createTestClient(env.DB, org.id);
            const { invoice } = await createTestInvoice(env.DB, client.id, org.id);
            const res = await makeRequest(env, "GET", `/api/v1/invoice/clients/${client.id}/invoices/${invoice.id}`, {
                cookies: { refresh_token: refreshToken },
            });
            const { status, body } = await parseResponse(res);
            expect(status).toBe(200);
            expect(body.invoice).toBeDefined();
            expect(body.invoice.id).toBe(invoice.id);
        });

        it("returns 404 for non-existent invoice", async () => {
            const { org, refreshToken } = await createTestUser(env.DB, env.JWT_SECRET);
            const { client } = await createTestClient(env.DB, org.id);
            const res = await makeRequest(env, "GET", `/api/v1/invoice/clients/${client.id}/invoices/nonexistent`, {
                cookies: { refresh_token: refreshToken },
            });
            const { status, body } = await parseResponse(res);
            expect(status).toBe(404);
            expect(body.message).toBe("Invoice not found");
        });
    });

    describe("POST /api/v1/invoice/clients/:clientId/invoices/create", () => {
        it("creates invoice for subscribed user", async () => {
            const { org, refreshToken } = await createTestUser(env.DB, env.JWT_SECRET, {
                paystackSubscriptionStatus: "active",
            });
            const { client } = await createTestClient(env.DB, org.id);
            const res = await makeRequest(env, "POST", `/api/v1/invoice/clients/${client.id}/invoices/create`, {
                body: {
                    clientId: client.id,
                    issueDate: new Date().toISOString(),
                    dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
                    status: "draft",
                    items: [{ description: "Service", quantity: 1, unitPrice: 100 }],
                    currency: "NGN",
                    taxRate: 0,
                    discount: 0,
                    notes: "Test invoice",
                },
                cookies: { refresh_token: refreshToken },
            });
            const { status, body } = await parseResponse(res);
            expect(status).toBe(200);
            expect(body.message).toBe("Invoice created");
            expect(body.data).toBeDefined();
        });

        it("allows invoice creation for active subscription without limit check", async () => {
            const { org, refreshToken } = await createTestUser(env.DB, env.JWT_SECRET, {
                paystackSubscriptionStatus: "active",
            });
            const { client } = await createTestClient(env.DB, org.id);

            // Create more than 5 invoices - should still work with active subscription
            for (let i = 0; i < 6; i++) {
                await createTestInvoice(env.DB, client.id, org.id);
            }

            const res = await makeRequest(env, "POST", `/api/v1/invoice/clients/${client.id}/invoices/create`, {
                body: {
                    clientId: client.id,
                    issueDate: new Date().toISOString(),
                    dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
                    status: "draft",
                    items: [{ description: "Service", quantity: 1, unitPrice: 100 }],
                    currency: "NGN",
                    taxRate: 0,
                    discount: 0,
                    notes: "Test invoice",
                },
                cookies: { refresh_token: refreshToken },
            });
            const { status, body } = await parseResponse(res);
            expect(status).toBe(200);
            expect(body.message).toBe("Invoice created");
        });
    });

    describe("PUT /api/v1/invoice/clients/:clientId/invoices/:invoiceId/edit", () => {
        it("updates an invoice", async () => {
            const { org, refreshToken } = await createTestUser(env.DB, env.JWT_SECRET);
            const { client } = await createTestClient(env.DB, org.id);
            const { invoice } = await createTestInvoice(env.DB, client.id, org.id);
            const res = await makeRequest(env, "PUT", `/api/v1/invoice/clients/${client.id}/invoices/${invoice.id}/edit`, {
                body: {
                    clientId: client.id,
                    issueDate: new Date().toISOString(),
                    dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
                    status: "sent",
                    items: [{ description: "Updated Service", quantity: 2, unitPrice: 200 }],
                    currency: "NGN",
                    taxRate: 10,
                    discount: 5,
                    notes: "Updated notes",
                },
                cookies: { refresh_token: refreshToken },
            });
            const { status, body } = await parseResponse(res);
            expect(status).toBe(200);
            expect(body.message).toBe("Invoice Updated");
        });
    });

    describe("DELETE /api/v1/invoice/clients/:clientId/invoices/:invoiceId/delete", () => {
        it("soft deletes an invoice", async () => {
            const { org, refreshToken } = await createTestUser(env.DB, env.JWT_SECRET);
            const { client } = await createTestClient(env.DB, org.id);
            const { invoice } = await createTestInvoice(env.DB, client.id, org.id);
            const res = await makeRequest(env, "DELETE", `/api/v1/invoice/clients/${client.id}/invoices/${invoice.id}/delete`, {
                cookies: { refresh_token: refreshToken },
            });
            const { status, body } = await parseResponse(res);
            expect(status).toBe(200);
            expect(body.message).toBe("Invoice deleted");
        });
    });
});
