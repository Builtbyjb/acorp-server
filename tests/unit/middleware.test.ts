import { describe, it, expect, vi } from "vitest";
import { authMiddleware } from "@/middleware/authentication";
import { planAccessMiddleware } from "@/middleware/plan-access";
import rateLimiterMiddleware from "@/middleware/rate-limiter";
import { createMockEnv } from "../setup/test-env";
import { drizzle } from "drizzle-orm/d1";
import { organizations } from "@/db/schemas";
import { sign } from "hono/jwt";
import { TokenPayload } from "@/lib/types";

function createMockContext(options: {
    env?: any;
    cookies?: Record<string, string>;
    headers?: Record<string, string>;
} = {}) {
    const env = options.env || createMockEnv();
    const headers = options.headers || {};

    return {
        env,
        req: {
            header: (name: string) => headers[name.toLowerCase()],
            raw: {
                headers: new Headers(headers),
            },
        },
        get: vi.fn(),
        set: vi.fn(),
        json: vi.fn((body: any, status?: number) => {
            return new Response(JSON.stringify(body), { status: status || 200 });
        }),
    } as any;
}

describe("authMiddleware", () => {
    it("returns 401 when no refresh_token cookie", async () => {
        const middleware = authMiddleware();
        const c = createMockContext();
        const next = vi.fn();
        await middleware(c, next);

        expect(c.json).toHaveBeenCalledWith(
            { message: "Unauthorized: Refresh token not found" },
            401,
        );
        expect(next).not.toHaveBeenCalled();
    });

    it("returns 500 when JWT_SECRET is missing", async () => {
        const env = createMockEnv();
        env.JWT_SECRET = "";
        const middleware = authMiddleware();
        const c = createMockContext({
            env,
            headers: { cookie: "refresh_token=some-token" },
        });
        const next = vi.fn();
        await middleware(c, next);

        expect(c.json).toHaveBeenCalledWith(
            { message: "Internal Server Error" },
            500,
        );
    });

    it("returns 401 for invalid token", async () => {
        const middleware = authMiddleware();
        const c = createMockContext({
            cookies: { refresh_token: "invalid-token" },
            headers: { cookie: "refresh_token=invalid-token" },
        });
        const next = vi.fn();
        await middleware(c, next);

        expect(c.json).toHaveBeenCalledWith(
            { message: "Unauthorized: Invalid token" },
            401,
        );
    });

    it("authenticates using Authorization header on mobile", async () => {
        const env = createMockEnv();
        const payload: TokenPayload = {
            userId: 1,
            username: "test",
            email: "test@acorp.app",
            currentOrgId: 1,
            exp: Math.floor(Date.now() / 1000) + 3600,
        };
        const token = await sign(payload, env.JWT_SECRET);

        const middleware = authMiddleware();
        const c = createMockContext({
            env,
            headers: {
                authorization: `Bearer ${token}`,
                "x-mobile-client": "true",
            },
        });
        const next = vi.fn();
        await middleware(c, next);

        expect(next).toHaveBeenCalled();
        expect(c.json).not.toHaveBeenCalled();
    });
});

describe("rateLimiterMiddleware", () => {
    it("allows request when under limit", async () => {
        const middleware = rateLimiterMiddleware();
        const env = createMockEnv();
        const c = createMockContext({
            env,
            headers: { "cf-connecting-ip": "192.168.1.1" },
        });
        const next = vi.fn();
        await middleware(c, next);

        expect(next).toHaveBeenCalled();
        expect(c.json).not.toHaveBeenCalled();
    });

    it("returns 429 when rate limit exceeded", async () => {
        const env = createMockEnv();
        env.RATE_LIMITER = {
            limit: async () => ({ success: false }),
        } as any;
        const middleware = rateLimiterMiddleware();
        const c = createMockContext({
            env,
            headers: { "cf-connecting-ip": "192.168.1.1" },
        });
        const next = vi.fn();
        await middleware(c, next);

        expect(c.json).toHaveBeenCalledWith(
            { message: "Too many requests" },
            429,
        );
        expect(next).not.toHaveBeenCalled();
    });
});

describe("planAccessMiddleware", () => {
    it("allows request when subscription is active locally", async () => {
        const middleware = planAccessMiddleware();
        const env = createMockEnv();
        const db = drizzle(env.DB);
        
        // Insert a test organization with active subscription
        await db.insert(organizations).values({
            id: 1,
            name: "Test Org",
            type: "business",
            paystackCustomerId: 12345,
            paystackSubscriptionStatus: "active",
            paymentProvider: "paystack",
            currency: "NGN",
        });
        
        const c = createMockContext({
            env,
        });
        c.get = vi.fn().mockReturnValue({
            userId: 1,
            currentOrgId: 1,
            paystackCustomerId: 12345,
        });
        const next = vi.fn();
        await middleware(c, next);

        expect(next).toHaveBeenCalled();
    });
});
