import { PaymentGateway, CustomerData, PlanData, InitializeSubscriptionResult, WebhookEvent } from "./types";

export class StripeGateway implements PaymentGateway {
    private secret: string;
    private webhookSecret: string;

    constructor(secret: string, webhookSecret: string) {
        this.secret = secret;
        this.webhookSecret = webhookSecret;
    }

    private async request(endpoint: string, options: RequestInit = {}): Promise<any> {
        const url = `https://api.stripe.com${endpoint}`;
        const auth = btoa(`${this.secret}:`);
        const response = await fetch(url, {
            ...options,
            headers: {
                "Authorization": `Basic ${auth}`,
                "Content-Type": "application/x-www-form-urlencoded",
                ...options.headers,
            },
        });

        if (!response.ok) {
            const error: any = await response.json();
            throw new Error(error.error?.message || `Stripe API error: ${response.status}`);
        }

        return response.json();
    }

    private encodeParams(params: Record<string, any>): string {
        return Object.entries(params)
            .filter(([, v]) => v !== undefined && v !== null)
            .map(([k, v]) => {
                if (Array.isArray(v)) {
                    return v.map((item, i) => this.encodeParams(Object.fromEntries(Object.entries(item).map(([ik, iv]) => [`${k}[${i}][${ik}]`, iv])))).join("").replace(/^&/, '');
                }
                return `${encodeURIComponent(k)}=${encodeURIComponent(v)}`;
            })
            .join("&");
    }

    async createCustomer(email: string, firstName: string, lastName: string): Promise<CustomerData> {
        const response = await this.request("/v1/customers", {
            method: "POST",
            body: this.encodeParams({
                email,
                name: `${firstName} ${lastName}`.trim(),
            }),
        });

        return {
            id: response.id,
            customerCode: response.id,
            email: response.email,
        };
    }

    async fetchPlans(): Promise<PlanData[]> {
        // Stripe plans are fetched from the prices endpoint or defined locally
        // We return an empty array here and let the plan.ts mapping handle it
        return [];
    }

    async initializeSubscription(
        email: string,
        planCode: string,
        successUrl?: string,
        cancelUrl?: string,
    ): Promise<InitializeSubscriptionResult> {
        const response = await this.request("/v1/checkout/sessions", {
            method: "POST",
            body: this.encodeParams({
                "customer": email,
                "mode": "subscription",
                "line_items[0][price]": planCode,
                "line_items[0][quantity]": 1,
                "success_url": successUrl || "",
                "cancel_url": cancelUrl || "",
                "subscription_data[metadata][plan_code]": planCode,
            }),
        });

        return {
            checkoutUrl: response.url,
            sessionId: response.id,
        };
    }

    async verifyTransaction(sessionId: string): Promise<any> {
        const session = await this.request(`/v1/checkout/sessions/${sessionId}`);
        const subscription = session.subscription
            ? await this.request(`/v1/subscriptions/${session.subscription}`)
            : null;

        return {
            status: session.payment_status === "paid",
            data: {
                status: session.payment_status === "paid" ? "success" : "failed",
                customer: { id: session.customer },
                planCode: session.metadata?.plan_code,
                plan: subscription
                    ? {
                        id: subscription.items?.data?.[0]?.price?.id,
                        name: subscription.items?.data?.[0]?.price?.nickname || "Subscription",
                        plan_code: subscription.items?.data?.[0]?.price?.id,
                        description: subscription.items?.data?.[0]?.price?.nickname || "Subscription",
                        amount: (subscription.items?.data?.[0]?.price?.unit_amount || 0) / 100,
                        interval: subscription.items?.data?.[0]?.price?.recurring?.interval || "monthly",
                        currency: subscription.items?.data?.[0]?.price?.currency?.toUpperCase(),
                    }
                    : null,
            },
        };
    }

    async fetchSubscriptions(customerId: string | number): Promise<any> {
        const response = await this.request(`/v1/subscriptions?customer=${customerId}&status=all`);
        return {
            data: response.data.map((s: any) => ({
                id: s.id,
                status: s.status,
                plan: {
                    name: s.items?.data?.[0]?.price?.nickname || "Subscription",
                    currency: s.items?.data?.[0]?.price?.currency?.toUpperCase(),
                },
                amount: s.items?.data?.[0]?.price?.unit_amount,
                subscription_code: s.id,
                email_token: s.id,
                next_payment_date: s.current_period_end
                    ? new Date(s.current_period_end * 1000).toISOString()
                    : null,
            })),
        };
    }

    async hasActiveSubscription(customerId: string | number): Promise<boolean> {
        try {
            const response = await this.request(`/v1/subscriptions?customer=${customerId}&status=active`);
            return response.data.length > 0;
        } catch {
            return false;
        }
    }

    async disableSubscription(code: string): Promise<Response> {
        await this.request(`/v1/subscriptions/${code}`, {
            method: "POST",
            body: this.encodeParams({
                cancel_at_period_end: true,
            }),
        });

        return new Response(JSON.stringify({ status: true, message: "Subscription cancelled" }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
        });
    }

    async getSubscriptionUpdateLink(code: string): Promise<Response> {
        // For Stripe, we create a customer portal session
        const result = await this.request("/v1/billing_portal/sessions", {
            method: "POST",
            body: this.encodeParams({
                customer: code,
            }),
        });

        return new Response(JSON.stringify({ status: true, data: { link: result.url } }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
        });
    }

    async verifyWebhookSignature(body: string, signature: string): Promise<boolean> {
        try {
            const elements = signature.split(",");
            const signatures: string[] = [];
            let timestamp = "";

            for (const element of elements) {
                const [prefix, value] = element.split("=");
                if (prefix === "t") {
                    timestamp = value;
                } else if (prefix === "v1") {
                    signatures.push(value);
                }
            }

            if (!timestamp || signatures.length === 0) return false;

            const signedPayload = `${timestamp}.${body}`;
            const encoder = new TextEncoder();
            const key = await crypto.subtle.importKey(
                "raw",
                encoder.encode(this.webhookSecret),
                { name: "HMAC", hash: "SHA-256" },
                false,
                ["sign"],
            );
            const signatureBuffer = await crypto.subtle.sign("HMAC", key, encoder.encode(signedPayload));
            const expectedSignature = Array.from(new Uint8Array(signatureBuffer))
                .map((b) => b.toString(16).padStart(2, "0"))
                .join("");

            return signatures.includes(expectedSignature);
        } catch {
            return false;
        }
    }

    async processWebhook(body: string): Promise<WebhookEvent> {
        const data = JSON.parse(body);
        return {
            type: data.type,
            data: data.data,
            rawBody: body,
        };
    }

    async createCustomerPortalSession(customerId: string, returnUrl: string): Promise<string> {
        const result = await this.request("/v1/billing_portal/sessions", {
            method: "POST",
            body: this.encodeParams({
                customer: customerId,
                return_url: returnUrl,
            }),
        });
        return result.url;
    }

    async createPayout(amount: number, currency: string, destination: string): Promise<any> {
        const result = await this.request("/v1/transfers", {
            method: "POST",
            body: this.encodeParams({
                amount: amount * 100, // Convert to cents
                currency: currency.toLowerCase(),
                destination,
            }),
        });
        return result;
    }
}
