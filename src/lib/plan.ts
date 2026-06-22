import { PaystackGateway } from "./payment/paystack-gateway";

type PlanMeta = {
    features: string[];
    cta: string;
    featured: boolean;
    disabled: boolean;
};

/* Paystack plan metadata (local features/CTA) */
export const planMeta: Record<string, PlanMeta> = {
    PLN_2zz8jgorepk0t2n: {
        // Pro plan
        features: ["Unlimited invoices", "Automatic reminders", "Priority support"],
        cta: "Get Pro Plan",
        featured: true,
        disabled: false,
    },
    PLN_naa6o3ymymu5un8: {
        // Team plan
        features: ["Everything in Pro", "Up to 5 team members", "Team collaboration", "Dedicated support"],
        cta: "Contact sales",
        featured: false,
        disabled: true,
    },
};

/* Stripe price IDs mapped by currency */
export const stripePrices: Record<string, Record<string, { priceId: string; amount: number; currency: string }>> = {
    pro: {
        USD: { priceId: "price_1ProUSD", amount: 7, currency: "USD" },
        CAD: { priceId: "price_1ProCAD", amount: 10, currency: "CAD" },
    },
    team: {
        USD: { priceId: "price_1TeamUSD", amount: 25, currency: "USD" },
        CAD: { priceId: "price_1TeamCAD", amount: 35, currency: "CAD" },
    },
};

export function freePlan(provider: string = "paystack", currency?: string) {
    const resolvedCurrency = provider === "stripe" ? (currency || "USD") : "NGN";
    return {
        id: 0,
        planCode: "PLN_free",
        name: "Free",
        amount: 0,
        currency: resolvedCurrency,
        interval: "monthly",
        description: "Perfect for getting started",
        features: ["Up to 5 invoices per month", "Email support", "PDF downloads"],
        cta: "Get started for free",
        featured: false,
        disabled: false,
    };
}

export async function getProviderPlans(provider: string, paystackSecret: string, currency?: string): Promise<any[]> {
    if (provider === "paystack") {
        const gateway = new PaystackGateway(paystackSecret);
        const plans = await gateway.fetchPlans();
        return plans.map((r) => ({
            id: r.id,
            planCode: r.planCode,
            name: r.name,
            description: r.description,
            amount: r.amount,
            currency: r.currency,
            interval: r.interval,
            features: planMeta[r.planCode]?.features || [],
            disabled: planMeta[r.planCode]?.disabled ?? false,
            featured: planMeta[r.planCode]?.featured ?? false,
            cta: planMeta[r.planCode]?.cta || "Subscribe",
        }));
    }

    // Stripe plans — return from local mapping since Stripe Prices are created in dashboard
    const targetCurrency = (currency || "USD").toUpperCase();
    const result: any[] = [];
    for (const [key, currencies] of Object.entries(stripePrices)) {
        const price = currencies[targetCurrency];
        if (!price) continue;

        const planCode = key === "pro" ? "PLN_2zz8jgorepk0t2n" : "PLN_naa6o3ymymu5un8";
        const meta = planMeta[planCode];
        result.push({
            id: price.priceId,
            planCode: price.priceId,
            name: key === "pro" ? "Pro" : "Team",
            description: key === "pro" ? "For growing businesses" : "For teams and collaboration",
            amount: price.amount,
            currency: price.currency,
            interval: "monthly",
            features: meta?.features || [],
            disabled: meta?.disabled ?? false,
            featured: meta?.featured ?? false,
            cta: meta?.cta || "Subscribe",
        });
    }
    return result;
}

export function getStripePriceId(planName: string, currency: string): string | undefined {
    const key = planName.toLowerCase().includes("team") ? "team" : "pro";
    return stripePrices[key]?.[currency]?.priceId;
}

export function getPlanAmount(provider: string, planCode: string, currency: string): number {
    if (provider === "paystack") {
        // Paystack amounts are returned from API
        return 0;
    }
    for (const [, currencies] of Object.entries(stripePrices)) {
        const price = currencies[currency];
        if (price?.priceId === planCode) return price.amount;
    }
    return 0;
}
