import { ContentfulStatusCode } from "hono/utils/http-status";
import type { JWTPayload } from "hono/utils/jwt/types";
import { clients, invoices } from "@/db/invoice-schema";

export type Bindings = {
    DB: D1Database;
    OTP_EMAIL: string;
    JWT_SECRET: string;
    SEND_EMAIL: {
        send: (email: { to: string; from: string; subject: string; text: string; html?: string }) => Promise<any>;
    };
    ENV: string;
    PAYSTACK_SECRET: string;
    STRIPE_SECRET_KEY: string;
    STRIPE_WEBHOOK_SECRET: string;
    STRIPE_PUBLISHABLE_KEY: string;
    INVOICE_URL: string;
    SERVER_URL: string;
    R2: R2Bucket;
    RATE_LIMITER: RateLimit;
    ESMS_API_KEY: string;
    WHATSAPP_PHONE_NUMBER_ID: string;
    WHATSAPP_ACCESS_TOKEN: string;
    META_GRAPH_API_VERSION: string;
};

export type TokenPayload = JWTPayload & {
    userId: number;
    email: string;
    username: string;
    currentOrgId: number;
    organizationName?: string;
    otp?: string;
    paymentProvider?: string;
    paystackCustomerCode?: string;
    paystackCustomerId?: number;
    stripeCustomerId?: string;
};

export type ReturnId = {
    id: number | undefined;
};

export class ErrorResult extends Error {
    public code: ContentfulStatusCode;

    constructor(message: string, code: ContentfulStatusCode, options?: ErrorOptions) {
        super(message, options);

        this.code = code;
        this.name = "ErrorResult";

        Object.setPrototypeOf(this, ErrorResult.prototype);
    }
}

export type Client = typeof clients.$inferSelect;
export type Invoice = typeof invoices.$inferSelect;
