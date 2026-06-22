import { describe, it, expect } from "vitest";
import {
    calculateRevenue,
    countPaidInvoices,
    countPendingInvoices,
    getInvoiceData,
    getMonthlyRevenues,
    getRecentInvoices,
} from "@/api/v1/invoice/user/user-service";
import {
    generateReferralCode,
    generateReferralLink,
    getSubscriptionAmount,
} from "@/api/v1/invoice/referral/referral-service";
import type { Invoice } from "@/lib/types";

function createInvoice(overrides: Partial<Invoice> = {}): Invoice {
    return {
        id: "inv-1",
        invoiceNumber: "INV-2024-1",
        clientId: "client-1",
        items: [{ description: "Service", quantity: 1, unitPrice: 100 }],
        taxRate: 10,
        discount: 0,
        status: "sent",
        signature: null,
        issueDate: new Date().toISOString() as any,
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() as any,
        currency: "NGN",
        notes: "Test",
        createdAt: new Date().toISOString(),
        ...overrides,
    };
}

describe("calculateRevenue", () => {
    it("returns 0 for empty array", () => {
        expect(calculateRevenue([])).toBe(0);
    });

    it("calculates total for paid invoices only", () => {
        const invoices = [
            createInvoice({ status: "paid", items: [{ description: "A", quantity: 2, unitPrice: 100 }], taxRate: 10 }),
            createInvoice({ status: "sent", items: [{ description: "B", quantity: 1, unitPrice: 200 }], taxRate: 0 }),
        ];
        // 2*100 = 200 subtotal, 10% tax = 20, total = 220
        expect(calculateRevenue(invoices)).toBe(220);
    });

    it("ignores draft and overdue invoices", () => {
        const invoices = [
            createInvoice({ status: "draft" }),
            createInvoice({ status: "overdue" }),
        ];
        expect(calculateRevenue(invoices)).toBe(0);
    });
});

describe("countPaidInvoices", () => {
    it("returns 0 for empty array", () => {
        expect(countPaidInvoices([])).toBe(0);
    });

    it("counts only paid invoices", () => {
        const invoices = [
            createInvoice({ status: "paid" }),
            createInvoice({ status: "paid" }),
            createInvoice({ status: "sent" }),
        ];
        expect(countPaidInvoices(invoices)).toBe(2);
    });
});

describe("countPendingInvoices", () => {
    it("returns 0 for empty array", () => {
        expect(countPendingInvoices([])).toBe(0);
    });

    it("counts sent and overdue invoices", () => {
        const invoices = [
            createInvoice({ status: "sent" }),
            createInvoice({ status: "overdue" }),
            createInvoice({ status: "paid" }),
            createInvoice({ status: "draft" }),
        ];
        expect(countPendingInvoices(invoices)).toBe(2);
    });
});

describe("getInvoiceData", () => {
    it("returns correct status breakdown", () => {
        const invoices = [
            createInvoice({ status: "paid" }),
            createInvoice({ status: "paid" }),
            createInvoice({ status: "sent" }),
            createInvoice({ status: "draft" }),
            createInvoice({ status: "overdue" }),
        ];
        const result = getInvoiceData(invoices);
        expect(result).toEqual([
            { status: "paid", count: 2 },
            { status: "sent", count: 1 },
            { status: "draft", count: 1 },
            { status: "overdue", count: 1 },
        ]);
    });
});

describe("getMonthlyRevenues", () => {
    it("returns 12 months with zero for no invoices", () => {
        const result = getMonthlyRevenues([]);
        expect(result).toHaveLength(12);
        expect(result.every((r) => r.revenue === 0)).toBe(true);
    });

        it("calculates revenue for current year invoices", () => {
            const now = new Date();
            const invoices = [
                createInvoice({
                    status: "paid",
                    issueDate: new Date(now.getFullYear(), 0, 15) as any,
                    items: [{ description: "A", quantity: 1, unitPrice: 100 }],
                }),
            ];
            const result = getMonthlyRevenues(invoices);
            expect(result[0].revenue).toBe(110); // January (100 subtotal + 10 tax)
            expect(result[1].revenue).toBe(0); // February
        });

        it("ignores invoices from other years", () => {
            const invoices = [
                createInvoice({
                    status: "paid",
                    issueDate: new Date(2020, 0, 15) as any,
                }),
            ];
            const result = getMonthlyRevenues(invoices);
            expect(result.every((r) => r.revenue === 0)).toBe(true);
        });
    });

    describe("getRecentInvoices", () => {
        it("returns invoices from current and previous month", () => {
            const now = new Date();
            const invoices = [
                createInvoice({ issueDate: new Date(now.getFullYear(), now.getMonth(), 1) as any }),
                createInvoice({ issueDate: new Date(now.getFullYear(), now.getMonth() - 1, 1) as any }),
                createInvoice({ issueDate: new Date(now.getFullYear(), now.getMonth() - 2, 1) as any }),
            ];
            const result = getRecentInvoices(invoices);
            expect(result).toHaveLength(2);
        });

        it("returns at most 10 invoices", () => {
            const now = new Date();
            const invoices = Array.from({ length: 15 }, () =>
                createInvoice({ issueDate: new Date(now.getFullYear(), now.getMonth(), 1) as any }),
            );
            const result = getRecentInvoices(invoices);
            expect(result).toHaveLength(10);
        });
    });

describe("generateReferralCode", () => {
    it("removes special characters and lowercases", () => {
        expect(generateReferralCode("My Company!")).toBe("mycompany");
        expect(generateReferralCode("A&B Corp")).toBe("abcorp");
    });

    it("handles single word", () => {
        expect(generateReferralCode("ACorp")).toBe("acorp");
    });
});

describe("generateReferralLink", () => {
    it("returns dev link for dev environment", () => {
        expect(generateReferralLink("dev", "acorp")).toBe("http://localhost:5173/signup?referral=acorp");
    });

    it("returns production link for non-dev", () => {
        expect(generateReferralLink("production", "acorp")).toBe("https://invoice.acorp.app/signup?referral=acorp");
    });

    it("returns 'No referral code' when code is null", () => {
        expect(generateReferralLink("dev", null)).toBe("No referral code");
    });
});

describe("getSubscriptionAmount", () => {
    it("returns NGN amount", () => {
        expect(getSubscriptionAmount("NGN")).toBe(9870);
    });

    it("returns USD amount", () => {
        expect(getSubscriptionAmount("USD")).toBe(7);
    });

    it("returns CAD amount", () => {
        expect(getSubscriptionAmount("CAD")).toBe(10);
    });

    it("returns default NGN for unknown currency", () => {
        expect(getSubscriptionAmount("EUR")).toBe(9870);
    });

    it("is case insensitive", () => {
        expect(getSubscriptionAmount("ngn")).toBe(9870);
        expect(getSubscriptionAmount("usd")).toBe(7);
    });
});
