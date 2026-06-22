import { PaymentGateway, CustomerData, PlanData, InitializeSubscriptionResult, WebhookEvent } from "./types";

export class PaystackGateway implements PaymentGateway {
    private secret: string;

    constructor(secret: string) {
        this.secret = secret;
    }

    private async request(endpoint: string, options: RequestInit = {}): Promise<any> {
        const url = `https://api.paystack.co${endpoint}`;
        const response = await fetch(url, {
            ...options,
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${this.secret}`,
                ...options.headers,
            },
        });
        return response;
    }

    async createCustomer(email: string, firstName: string, lastName: string): Promise<CustomerData> {
        const response = await this.request("/customer", {
            method: "POST",
            body: JSON.stringify({
                email,
                first_name: firstName,
                last_name: lastName,
            }),
        });

        const result = await response.json();
        if (!result.status || !result.data) {
            throw new Error(result.message || "Failed to create Paystack customer");
        }

        return {
            id: result.data.id,
            customerCode: result.data.customer_code,
            email: result.data.email,
        };
    }

    async fetchPlans(): Promise<PlanData[]> {
        const response = await this.request("/plan");
        const result = await response.json();

        if (!result.status || !result.data) {
            throw new Error("Failed to fetch Paystack plans");
        }

        return result.data.map((r: any) => ({
            id: r.id,
            planCode: r.plan_code,
            name: r.name,
            description: r.description,
            amount: r.amount / 100,
            currency: r.currency,
            interval: r.interval,
        }));
    }

    async initializeSubscription(
        email: string,
        planCode: string,
    ): Promise<InitializeSubscriptionResult> {
        const response = await this.request("/transaction/initialize", {
            method: "POST",
            body: JSON.stringify({
                email,
                amount: 0,
                plan: planCode,
            }),
        });

        const result = await response.json();
        return {
            authorizationUrl: result.data?.authorization_url,
            reference: result.data?.reference,
        };
    }

    async verifyTransaction(reference: string): Promise<any> {
        const response = await this.request(`/transaction/verify/${reference}`);
        return response.json();
    }

    async fetchSubscriptions(customerId: string | number): Promise<any> {
        const response = await this.request(`/subscription?customer=${customerId}`);
        if (!response.ok) return new Error("Failed to fetch subscriptions");
        return response.json();
    }

    async hasActiveSubscription(customerId: string | number): Promise<boolean> {
        try {
            const subscriptions = await this.fetchSubscriptions(customerId);
            if (subscriptions.data && subscriptions.data.length > 0) {
                return subscriptions.data.some(
                    (s: any) =>
                        s.status === "active" ||
                        (s.status === "non-renewing" && s.next_payment_date >= new Date().toISOString()),
                );
            }
            return false;
        } catch {
            return false;
        }
    }

    async disableSubscription(code: string, token?: string): Promise<Response> {
        return this.request("/subscription/disable", {
            method: "POST",
            body: JSON.stringify({ code, token }),
        });
    }

    async getSubscriptionUpdateLink(code: string): Promise<Response> {
        return this.request(`/subscription/${code}/manage/link`);
    }

    async verifyWebhookSignature(body: string, signature: string): Promise<boolean> {
        const encoder = new TextEncoder();
        const key = await crypto.subtle.importKey(
            "raw",
            encoder.encode(this.secret),
            { name: "HMAC", hash: "SHA-512" },
            false,
            ["sign"],
        );
        const signatureBuffer = await crypto.subtle.sign("HMAC", key, encoder.encode(body));
        const hash = Array.from(new Uint8Array(signatureBuffer))
            .map((b) => b.toString(16).padStart(2, "0"))
            .join("");
        return hash === signature;
    }

    async processWebhook(body: string): Promise<WebhookEvent> {
        const data = JSON.parse(body);
        return {
            type: data.event,
            data: data.data,
            rawBody: body,
        };
    }

    async createTransfer(recipientCode: string, amount: number, currency: string, reason: string): Promise<any> {
        const response = await this.request("/transfer", {
            method: "POST",
            body: JSON.stringify({
                source: "balance",
                amount: amount * 100, // Convert to kobo
                recipient: recipientCode,
                reason,
                currency,
            }),
        });
        return response.json();
    }
}
