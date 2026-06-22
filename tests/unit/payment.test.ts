import { describe, it, expect } from "vitest";
import { getGateway, detectProvider, getCurrency, PaymentProvider } from "@/lib/payment";
import { PaystackGateway } from "@/lib/payment/paystack-gateway";
import { StripeGateway } from "@/lib/payment/stripe-gateway";

describe("getGateway", () => {
    it("returns PaystackGateway for paystack provider", () => {
        const env = { PAYSTACK_SECRET: "secret", STRIPE_SECRET_KEY: "sk", STRIPE_WEBHOOK_SECRET: "wh" };
        const gateway = getGateway("paystack", env);
        expect(gateway).toBeInstanceOf(PaystackGateway);
    });

    it("returns StripeGateway for stripe provider", () => {
        const env = { PAYSTACK_SECRET: "secret", STRIPE_SECRET_KEY: "sk", STRIPE_WEBHOOK_SECRET: "wh" };
        const gateway = getGateway("stripe", env);
        expect(gateway).toBeInstanceOf(StripeGateway);
    });

    it("throws for unsupported provider", () => {
        const env = { PAYSTACK_SECRET: "secret", STRIKE_SECRET_KEY: "sk", STRIPE_WEBHOOK_SECRET: "wh" };
        expect(() => getGateway("invalid" as PaymentProvider, env as any)).toThrow("Unsupported payment provider");
    });
});

describe("detectProvider", () => {
    it("detects paystack for Nigeria", () => {
        expect(detectProvider("Nigeria")).toBe("paystack");
        expect(detectProvider("nigeria")).toBe("paystack");
    });

    it("detects paystack for Ghana", () => {
        expect(detectProvider("Ghana")).toBe("paystack");
    });

    it("detects paystack for South Africa", () => {
        expect(detectProvider("South Africa")).toBe("paystack");
    });

    it("detects stripe for United States", () => {
        expect(detectProvider("United States")).toBe("stripe");
        expect(detectProvider("us")).toBe("stripe");
        expect(detectProvider("usa")).toBe("stripe");
    });

    it("detects stripe for Canada", () => {
        expect(detectProvider("Canada")).toBe("stripe");
        expect(detectProvider("ca")).toBe("stripe");
    });

    it("returns null for unsupported country", () => {
        expect(detectProvider("Germany")).toBeNull();
        expect(detectProvider("")).toBeNull();
    });

    it("trims and lowercases input", () => {
        expect(detectProvider("  Nigeria  ")).toBe("paystack");
        expect(detectProvider("  USA  ")).toBe("stripe");
    });
});

describe("getCurrency", () => {
    it("returns NGN for paystack", () => {
        expect(getCurrency("paystack")).toBe("NGN");
    });

    it("returns USD for stripe", () => {
        expect(getCurrency("stripe")).toBe("USD");
    });

    it("returns NGN for unknown provider", () => {
        expect(getCurrency("unknown" as PaymentProvider)).toBe("NGN");
    });
});
