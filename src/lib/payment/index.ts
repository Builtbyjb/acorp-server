import { PaymentGateway } from "./types";
import { PaystackGateway } from "./paystack-gateway";
import { StripeGateway } from "./stripe-gateway";

export type PaymentProvider = "paystack" | "stripe";

export function getGateway(
    provider: PaymentProvider,
    env: { PAYSTACK_SECRET: string; STRIPE_SECRET_KEY: string; STRIPE_WEBHOOK_SECRET: string },
): PaymentGateway {
    switch (provider) {
        case "paystack":
            return new PaystackGateway(env.PAYSTACK_SECRET);
        case "stripe":
            return new StripeGateway(env.STRIPE_SECRET_KEY, env.STRIPE_WEBHOOK_SECRET);
        default:
            throw new Error(`Unsupported payment provider: ${provider}`);
    }
}

export function detectProvider(country: string): PaymentProvider | null {
    const paystackCountries = [
        "nigeria", "ghana", "south africa", "kenya", "cote d'ivoire",
        "ivory coast", "egypt", "senegal", "cameroon", "togo",
        "uganda", "tanzania", "mali", "burkina faso", "niger",
    ];
    const stripeCountries = [
        "united states", "us", "usa", "canada", "ca",
    ];

    const normalized = country.toLowerCase().trim();

    if (paystackCountries.includes(normalized)) return "paystack";
    if (stripeCountries.includes(normalized)) return "stripe";

    return null;
}

export function getCurrency(provider: PaymentProvider): string {
    switch (provider) {
        case "paystack":
            return "NGN";
        case "stripe":
            return "USD"; // Default, can be overridden
        default:
            return "NGN";
    }
}

const COUNTRY_CURRENCY_MAP: Record<string, string> = {
    nigeria: "NGN",
    usa: "USD",
    "united states": "USD",
    us: "USD",
    canada: "CAD",
    ca: "CAD",
};

export function countryToCurrency(country: string): string | null {
    const normalized = country.toLowerCase().trim();
    return COUNTRY_CURRENCY_MAP[normalized] || null;
}
