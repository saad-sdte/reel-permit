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
}): Promise<{ sessionId: string; planId: string | null; purchaseUrl: string | null }> {
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
      ...(productId ? { product_id: productId } : {}),
    },
  });

  const planId = cfg.plan?.id ?? null;

  try {
    const session = await client.checkoutSessions.create({
      checkout_configuration: cfg.id,
      metadata,
      return_url: `${site}/apply?whop=return`,
    });
    return {
      sessionId: session.id,
      planId,
      purchaseUrl: cfg.purchase_url ?? null,
    };
  } catch {
    return {
      sessionId: cfg.id,
      planId,
      purchaseUrl: cfg.purchase_url ?? null,
    };
  }
}
