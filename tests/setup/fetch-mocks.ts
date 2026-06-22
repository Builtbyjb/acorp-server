type MockResponse = {
    status?: number;
    body?: any;
    headers?: Record<string, string>;
};

const mockResponses = new Map<string, MockResponse>();

export function mockFetch(urlPattern: string | RegExp, response: MockResponse) {
    mockResponses.set(urlPattern.toString(), response);
}

export function clearFetchMocks() {
    mockResponses.clear();
}

export function setupMockFetch() {
    const originalFetch = globalThis.fetch;

    globalThis.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
        const url = input.toString();

        for (const [pattern, response] of mockResponses.entries()) {
            const regex = new RegExp(pattern.replace(/^\/(.*)\/$/, "$1"));
            if (regex.test(url)) {
                return new Response(
                    JSON.stringify(response.body || {}),
                    {
                        status: response.status || 200,
                        headers: response.headers || { "Content-Type": "application/json" },
                    },
                );
            }
        }

        // Default Paystack mocks
        if (url.includes("api.paystack.co/customer")) {
            return new Response(
                JSON.stringify({
                    status: true,
                    data: {
                        id: 12345,
                        customer_code: "CUS_test123",
                        email: "test@example.com",
                    },
                }),
                { status: 200, headers: { "Content-Type": "application/json" } },
            );
        }

        if (url.includes("api.paystack.co/plan")) {
            return new Response(
                JSON.stringify({
                    status: true,
                    data: [
                        {
                            id: 1,
                            plan_code: "PLN_test",
                            name: "Pro Plan",
                            description: "Professional plan",
                            amount: 987000,
                            currency: "NGN",
                            interval: "monthly",
                        },
                    ],
                }),
                { status: 200, headers: { "Content-Type": "application/json" } },
            );
        }

        if (url.includes("api.paystack.co/transaction/initialize")) {
            return new Response(
                JSON.stringify({
                    status: true,
                    data: {
                        authorization_url: "https://paystack.com/pay/test",
                        reference: "ref_test123",
                    },
                }),
                { status: 200, headers: { "Content-Type": "application/json" } },
            );
        }

        if (url.includes("api.paystack.co/transaction/verify")) {
            return new Response(
                JSON.stringify({
                    status: true,
                    message: "Verification successful",
                    data: {
                        id: 123,
                        domain: "test",
                        status: "success",
                        reference: "ref_test123",
                        receipt_number: null,
                        amount: 100000,
                        message: null,
                        gateway_response: "Successful",
                        response_code: "00",
                        paid_at: new Date().toISOString(),
                        created_at: new Date().toISOString(),
                        channel: "card",
                        currency: "NGN",
                        ip_address: "127.0.0.1",
                        metadata: { referrer: "https://test.com" },
                        log: {
                            start_time: Date.now(),
                            time_spent: 10,
                            attempts: 1,
                            errors: 0,
                            success: true,
                            mobile: false,
                            input: [],
                            history: [],
                        },
                        fees: 100,
                        fees_split: null,
                        authorization: {
                            authorization_code: "AUTH_test",
                            bin: "123456",
                            last4: "1234",
                            exp_month: "12",
                            exp_year: "2025",
                            channel: "card",
                            card_type: "visa",
                            bank: "Test Bank",
                            country_code: "NG",
                            brand: "visa",
                            reusable: true,
                            signature: "SIG_test",
                            account_name: null,
                            receiver_bank_account_number: null,
                            receiver_bank: null,
                        },
                        customer: {
                            id: 12345,
                            first_name: "Test",
                            last_name: "User",
                            email: "test@example.com",
                            customer_code: "CUS_test123",
                            phone: "+1234567890",
                            metadata: null,
                            risk_action: "default",
                            international_format_phone: null,
                        },
                        planCode: "PLN_test",
                        plan: {
                            id: 1,
                            name: "Pro Plan",
                            plan_code: "PLN_test",
                            description: "Pro Plan",
                            amount: 100000,
                            interval: "monthly",
                            send_invoices: true,
                            send_sms: false,
                            currency: "NGN",
                        },
                        split: {},
                        order_id: null,
                        paidAt: new Date().toISOString(),
                        createdAt: new Date().toISOString(),
                        requested_amount: 100000,
                        pos_transaction_data: null,
                        source: null,
                        fees_breakdown: null,
                        connect: null,
                        transaction_date: new Date().toISOString(),
                        subaccount: {},
                    },
                }),
                { status: 200, headers: { "Content-Type": "application/json" } },
            );
        }

        if (url.includes("api.paystack.co/subscription/disable")) {
            return new Response(
                JSON.stringify({ status: true, message: "Subscription disabled" }),
                { status: 200, headers: { "Content-Type": "application/json" } },
            );
        }

        if (url.includes("api.paystack.co/subscription/") && url.includes("/manage/link")) {
            return new Response(
                JSON.stringify({
                    status: true,
                    data: { link: "https://paystack.com/manage/SUB_test" },
                }),
                { status: 200, headers: { "Content-Type": "application/json" } },
            );
        }

        if (url.includes("api.paystack.co/subscription")) {
            return new Response(
                JSON.stringify({
                    status: true,
                    data: [
                        {
                            id: 1,
                            status: "active",
                            plan: { name: "Pro Plan", currency: "NGN" },
                            amount: 987000,
                            subscription_code: "SUB_test",
                            email_token: "token_test",
                            next_payment_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
                        },
                    ],
                }),
                { status: 200, headers: { "Content-Type": "application/json" } },
            );
        }

        if (url.includes("api.paystack.co/transferrecipient")) {
            return new Response(
                JSON.stringify({
                    status: true,
                    data: { recipient_code: "RCP_test123" },
                }),
                { status: 200, headers: { "Content-Type": "application/json" } },
            );
        }

        if (url.includes("api.paystack.co/transfer")) {
            return new Response(
                JSON.stringify({
                    status: true,
                    data: { reference: "TRF_test123", transfer_code: "TRF_test123" },
                }),
                { status: 200, headers: { "Content-Type": "application/json" } },
            );
        }

        // Default Stripe mocks
        if (url.includes("api.stripe.com/v1/customers")) {
            return new Response(
                JSON.stringify({
                    id: "cus_test123",
                    email: "test@example.com",
                }),
                { status: 200, headers: { "Content-Type": "application/json" } },
            );
        }

        if (url.includes("api.stripe.com/v1/checkout/sessions")) {
            return new Response(
                JSON.stringify({
                    id: "cs_test123",
                    url: "https://stripe.com/checkout/test",
                    payment_status: "paid",
                    customer: "cus_test123",
                    metadata: { plan_code: "price_test" },
                    subscription: "sub_test123",
                }),
                { status: 200, headers: { "Content-Type": "application/json" } },
            );
        }

        if (url.includes("api.stripe.com/v1/subscriptions")) {
            return new Response(
                JSON.stringify({
                    data: [],
                }),
                { status: 200, headers: { "Content-Type": "application/json" } },
            );
        }

        if (url.includes("api.stripe.com/v1/billing_portal/sessions")) {
            return new Response(
                JSON.stringify({
                    status: true,
                    data: {
                        link: "https://stripe.com/billing/test",
                        url: "https://stripe.com/billing/test",
                    },
                }),
                { status: 200, headers: { "Content-Type": "application/json" } },
            );
        }

        return originalFetch(input, init);
    };

    return () => {
        globalThis.fetch = originalFetch;
    };
}
