import { describe, it, expect, beforeEach } from "vitest";
import { createMockEnv } from "../setup/test-env";
import { migrateTestDb, clearTestDb } from "../setup/test-db";
import { createTestUser } from "../setup/test-factories";
import { setupMockFetch } from "../setup/fetch-mocks";
import { makeRequest, parseResponse, getCookies } from "../setup/test-client";

describe("Auth E2E", () => {
    let env: ReturnType<typeof createMockEnv>;
    let restoreFetch: () => void;

    beforeEach(async () => {
        env = createMockEnv();
        restoreFetch = setupMockFetch();
        await migrateTestDb(env.DB);
        await clearTestDb(env.DB);
    });

    afterEach(() => {
        restoreFetch();
    });

    describe("POST /api/v1/auth/login", () => {
        it("returns 404 for non-existent user", async () => {
            const res = await makeRequest(env, "POST", "/api/v1/auth/login", {
                body: { email: "nonexistent@example.com" },
            });
            const { status, body } = await parseResponse(res);
            expect(status).toBe(404);
            expect(body.message).toBe("User not found");
        });

        it("returns 200 and sets OTP cookie for valid user", async () => {
            const { user } = await createTestUser(env.DB, env.JWT_SECRET);
            const res = await makeRequest(env, "POST", "/api/v1/auth/login", {
                body: { email: user.email },
            });
            const { status, body } = await parseResponse(res);
            expect(status).toBe(200);
            expect(body.message).toBe("OTP sent to your email");
            const cookies = getCookies(res);
            expect(cookies.otp_token).toBeDefined();
        });
    });

    describe("POST /api/v1/auth/signup", () => {
        it("returns 400 for invalid input", async () => {
            const res = await makeRequest(env, "POST", "/api/v1/auth/signup", {
                body: { email: "invalid" },
            });
            const { status } = await parseResponse(res);
            expect(status).toBe(400);
        });

        it("returns 400 for duplicate email", async () => {
            const { user } = await createTestUser(env.DB, env.JWT_SECRET);
            const res = await makeRequest(env, "POST", "/api/v1/auth/signup", {
                body: {
                    firstname: "Test",
                    lastname: "User",
                    email: user.email,
                    username: "newuser",
                    businessName: "New Business",
                    businessType: "llc",
                    businessAddress: "123 St",
                    city: "Lagos",
                    country: "Nigeria",
                    website: "https://test.com",
                },
            });
            const { status, body } = await parseResponse(res);
            expect(status).toBe(400);
            expect(body.message).toContain("email address exists");
        });

        it("returns 200 and sets OTP cookie for valid signup", async () => {
            const res = await makeRequest(env, "POST", "/api/v1/auth/signup", {
                body: {
                    firstname: "Test",
                    lastname: "User",
                    email: "newuser@example.com",
                    username: "newuser",
                    businessName: "New Business",
                    businessType: "llc",
                    businessAddress: "123 St",
                    city: "Lagos",
                    country: "Nigeria",
                    website: "https://test.com",
                },
            });
            const { status, body } = await parseResponse(res);
            expect(status).toBe(200);
            expect(body.message).toBe("Sign up completed");
            const cookies = getCookies(res);
            expect(cookies.otp_token).toBeDefined();
        });
    });

    describe("POST /api/v1/auth/verify-otp", () => {
        it("returns 400 for invalid OTP", async () => {
            const { user } = await createTestUser(env.DB, env.JWT_SECRET);
            const loginRes = await makeRequest(env, "POST", "/api/v1/auth/login", {
                body: { email: user.email },
            });
            const cookies = getCookies(loginRes);

            const res = await makeRequest(env, "POST", "/api/v1/auth/verify-otp", {
                body: { otp: "00000000" },
                cookies,
            });
            const { status, body } = await parseResponse(res);
            expect(status).toBe(400);
            expect(body.message).toBe("Invalid OTP");
        });
    });

    describe("GET /api/v1/auth/refresh-token", () => {
        it("returns 404 without refresh_token", async () => {
            const res = await makeRequest(env, "GET", "/api/v1/auth/refresh-token");
            const { status, body } = await parseResponse(res);
            expect(status).toBe(404);
            expect(body.message).toContain("token not found");
        });

        it("returns new access token with valid refresh_token", async () => {
            const { refreshToken } = await createTestUser(env.DB, env.JWT_SECRET);
            const res = await makeRequest(env, "GET", "/api/v1/auth/refresh-token", {
                cookies: { refresh_token: refreshToken },
            });
            const { status, body } = await parseResponse(res);
            expect(status).toBe(200);
            expect(body.accessToken).toBeDefined();
            expect(body.user).toBeDefined();
        });
    });

    describe("GET /api/v1/auth/logout", () => {
        it("clears refresh_token cookie", async () => {
            const res = await makeRequest(env, "GET", "/api/v1/auth/logout");
            const { status, body } = await parseResponse(res);
            expect(status).toBe(200);
            expect(body.message).toBe("Logged out");
            // The set-cookie header should be present (deleting the cookie)
            const setCookie = res.headers.get("set-cookie");
            expect(setCookie).toBeDefined();
            expect(setCookie).toContain("refresh_token");
        });
    });
});
