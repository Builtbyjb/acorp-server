import { describe, it, expect, vi } from "vitest";
import {
    generateOTP,
    getNewInvoiceNumber,
    fillTemplate,
    handleZodValidate,
    getBlobURL,
} from "@/lib/utils";
import { createMockEnv } from "../setup/test-env";

describe("generateOTP", () => {
    it("returns an 8-digit string", () => {
        const otp = generateOTP();
        expect(otp).toHaveLength(8);
        expect(/\d{8}/.test(otp)).toBe(true);
    });

    it("returns different values on successive calls", () => {
        const otp1 = generateOTP();
        const otp2 = generateOTP();
        expect(otp1).not.toBe(otp2);
    });

    it("returns only numeric characters", () => {
        const otp = generateOTP();
        expect(Number(otp)).not.toBeNaN();
    });
});

describe("getNewInvoiceNumber", () => {
    it("increments current number when year is the same", () => {
        const currentYear = new Date().getFullYear();
        const result = getNewInvoiceNumber({ year: currentYear, currentNumber: 5 });
        expect(result).toEqual({ year: currentYear, currentNumber: 6 });
    });

    it("resets to 1 when year rolls over", () => {
        const currentYear = new Date().getFullYear();
        const result = getNewInvoiceNumber({ year: currentYear - 1, currentNumber: 100 });
        expect(result).toEqual({ year: currentYear, currentNumber: 1 });
    });

    it("handles year 2000 default", () => {
        const currentYear = new Date().getFullYear();
        const result = getNewInvoiceNumber({ year: 2000, currentNumber: 0 });
        expect(result).toEqual({ year: currentYear, currentNumber: 1 });
    });
});

describe("fillTemplate", () => {
    it("replaces all variables in template", () => {
        const template = "Hello {{NAME}}, your code is {{CODE}}";
        const result = fillTemplate(template, { NAME: "World", CODE: "1234" });
        expect(result).toBe("Hello World, your code is 1234");
    });

    it("leaves unmatched placeholders unchanged", () => {
        const template = "Hello {{NAME}}, missing {{OTHER}}";
        const result = fillTemplate(template, { NAME: "World" });
        expect(result).toBe("Hello World, missing {{OTHER}}");
    });

    it("handles empty variables", () => {
        const template = "Hello {{NAME}}";
        const result = fillTemplate(template, {});
        expect(result).toBe("Hello {{NAME}}");
    });

    it("replaces multiple occurrences", () => {
        const template = "{{X}} and {{X}}";
        const result = fillTemplate(template, { X: "Y" });
        expect(result).toBe("Y and Y");
    });
});

describe("handleZodValidate", () => {
    it("returns undefined when validation succeeds", () => {
        const c = { json: vi.fn() } as any;
        const result = handleZodValidate({ success: true, data: {} }, c);
        expect(c.json).not.toHaveBeenCalled();
        expect(result).toBeUndefined();
    });

    it("returns 400 response when validation fails", () => {
        const c = { json: vi.fn() } as any;
        handleZodValidate({ success: false, error: new Error("Invalid") }, c);
        expect(c.json).toHaveBeenCalledWith({ message: "Zod Validation Error" }, 400);
    });
});

describe("getBlobURL", () => {
    it("constructs correct blob URL", () => {
        const env = createMockEnv();
        const c = {
            env: { SERVER_URL: env.SERVER_URL },
        } as any;
        const url = getBlobURL(c, "test-key");
        expect(url).toBe("http://localhost:8585/api/v1/invoice/blobs/test-key");
    });
});
