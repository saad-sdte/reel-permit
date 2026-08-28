import { WhopClient } from "@whop/sdk";

function env(name: string): string | undefined {
  const v = process.env[name];
  return v && v.trim() ? v.trim() : undefined;
}

export function whopConfigured(): boolean {
  return Boolean(env("WHOP_API_KEY") && env("WHOP_COMPANY_ID"));
}

export function paymentDescriptor(): string {
  return env("PAYMENT_DESCRIPTOR") ?? env("NMI_DESCRIPTOR") ?? "REELPERMIT";
}

export function getWhopClient(): WhopClient {
  const token = env("WHOP_API_KEY");
  if (!token) throw new Error("WHOP_API_KEY is not set");
  return new WhopClient({ token });
}

export async function createWhopCheckoutSession(args: {
  amountUsd: number;
  title: string;
  applicationId: string;
  reference: string;
}): Promise<{ sessionId: string; planId: string; purchaseUrl: string | null }> {
  const accountId = env("WHOP_COMPANY_ID");
  if (!accountId) throw new Error("WHOP_COMPANY_ID is not set");

  const site = (env("NEXT_PUBLIC_SITE_URL") ?? "https://reelpermit.com").replace(/\/$/, "");
  const client = getWhopClient();
  const productId = env("WHOP_PRODUCT_ID");
  const metadata = {
    application_id: args.applicationId,
    reference: args.reference,
  };
  // Whop dynamic plans reject titles longer than 30 characters.
  const title = (args.reference || args.title || "ReelPermit").trim().slice(0, 30);
  const initialPrice = Math.round(args.amountUsd * 100) / 100;

  const cfg = await client.checkoutConfigurations.create({
    account_id: accountId,
    mode: "payment",
    redirect_url: `${site}/apply?whop=return`,
    metadata,
    plan: {
      plan_type: "one_time",
      currency: "usd",
      initial_price: initialPrice,
      title,
      force_create_new_plan: true,
      visibility: "visible",
      // Copied onto the payment when the buyer checks out this plan in the embed.
      metadata,
      ...(productId ? { product_id: productId } : {}),
    },
  });

  const planId = cfg.plan?.id;
  if (!planId) {
    throw new Error("Checkout configuration did not return a plan id");
  }

  // WhopCheckoutEmbed puts sessionId in the iframe path (`/embedded/checkout/{id}/`).
  // Only plan_ ids resolve there. ch_ (checkout config) and chs_ (checkout session)
  // both 404 with Whop's "Nothing to see here yet" page. Keep cfg.id for logs only.
  return {
    sessionId: cfg.id,
    planId,
    purchaseUrl: cfg.purchase_url ?? null,
  };
}
