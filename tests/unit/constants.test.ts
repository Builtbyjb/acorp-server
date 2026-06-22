import { describe, it, expect } from "vitest";
import {
    ACCESS_TOKEN_MAX_AGE,
    getAccessTokenExp,
    REFRESH_TOKEN_MAX_AGE,
    getRefreshTokenExp,
    INTERNAL_ERROR_MESSAGE,
} from "@/lib/constants";

describe("ACCESS_TOKEN_MAX_AGE", () => {
    it("equals 1800 seconds (30 minutes)", () => {
        expect(ACCESS_TOKEN_MAX_AGE).toBe(1800);
    });
});

describe("getAccessTokenExp", () => {
    it("returns timestamp approximately 30 minutes in the future", () => {
        const now = Math.floor(Date.now() / 1000);
        const exp = getAccessTokenExp();
        expect(exp).toBeGreaterThanOrEqual(now + 1790);
        expect(exp).toBeLessThanOrEqual(now + 1810);
    });
});

describe("REFRESH_TOKEN_MAX_AGE", () => {
    it("equals 7776000 seconds (90 days)", () => {
        expect(REFRESH_TOKEN_MAX_AGE).toBe(7776000);
    });
});

describe("getRefreshTokenExp", () => {
    it("returns timestamp approximately 90 days in the future", () => {
        const now = Math.floor(Date.now() / 1000);
        const exp = getRefreshTokenExp();
        expect(exp).toBeGreaterThanOrEqual(now + 7775000);
        expect(exp).toBeLessThanOrEqual(now + 7777000);
    });
});

describe("INTERNAL_ERROR_MESSAGE", () => {
    it("contains the expected text", () => {
        expect(INTERNAL_ERROR_MESSAGE).toContain("internal issue");
        expect(INTERNAL_ERROR_MESSAGE).toContain("actively investigating");
    });
});
