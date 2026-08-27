/**
 * NMI (Network Merchants Inc.) payment gateway — server side.
 *
 * Flow (Collect.js tokenization):
 *   1. The browser collects card number / expiry / CVV and tokenizes them
 *      CLIENT-SIDE via Collect.js. Raw card data never touches this server —
 *      and it must stay that way. DO NOT add raw card-number/cvv/expiry
 *      fields to any API route or server code: that would drag the whole
 *      deployment into PCI DSS SAQ-D scope. Tokens and vault ids only.
 *   2. Our API receives only the single-use `payment_token` (or a stored
 *      customer-vault id for retries) and calls the NMI Direct Post API
 *      (transact.php) with the SERVER-COMPUTED amount — never a client
 *      amount — and the statement descriptor.
 *
 * Environment (NEVER hardcode keys in this repo):
 *   NMI_PRIVATE_SECURITY_KEY      SERVER ONLY. Private security key for
 *                                 transact.php. (NMI_SECURITY_KEY is accepted
 *                                 as an alias.) When unset the gateway runs in
 *                                 dev mode and simulates approvals.
 *   NMI_API_URL                   Optional endpoint override (defaults to the
 *                                 standard NMI endpoint below).
 *   NMI_DESCRIPTOR                Card-statement descriptor shown on the
 *                                 customer's receipt. Default "REELPERMIT".
 *   NMI_ENABLE_CUSTOMER_VAULT     "true" to store cards in NMI's Customer
 *                                 Vault on successful checkout so retry links
 *                                 can offer "use card on file". OFF by default:
 *                                 enabling requires consent copy at checkout.
 */

const DEFAULT_NMI_ENDPOINT = "https://secure.networkmerchants.com/api/transact.php";

function nmiEndpoint(): string {
  return process.env.NMI_API_URL?.trim() || DEFAULT_NMI_ENDPOINT;
}

/** Private security key — repo name first, spec alias second. */
function nmiSecurityKey(): string | undefined {
  const v = process.env.NMI_PRIVATE_SECURITY_KEY ?? process.env.NMI_SECURITY_KEY;
  return v && v.trim() ? v.trim() : undefined;
}

export const NMI_DESCRIPTOR = process.env.NMI_DESCRIPTOR ?? "REELPERMIT";

/** True when a real gateway key is configured (false = dev/simulated mode). */
export function nmiConfigured(): boolean {
  return Boolean(nmiSecurityKey());
}

/** True when vaulting cards on checkout is enabled (requires consent copy). */
export function vaultEnabled(): boolean {
  return process.env.NMI_ENABLE_CUSTOMER_VAULT === "true";
}

/* ------------------------------------------------------------------ */
/* decline normalization                                               */
/* ------------------------------------------------------------------ */

export type DeclineCode =
  | "insufficient_funds"
  | "do_not_honor"
  | "expired_card"
  | "incorrect_card"
  | "invalid_cvv"
  | "over_limit"
  | "card_not_supported"
  | "suspected_fraud"
  | "duplicate_transaction"
  | "retry_later"
  | "processor_error"
  | "gateway_error"
  | "generic_decline";

export interface DeclineInfo {
  code: DeclineCode;
  /** Customer-safe message — shown in the UI and in the declined email. */
  message: string;
  /** Whether inviting the customer to retry makes sense. */
  retriable: boolean;
}

const DECLINE_MESSAGES: Record<DeclineCode, { message: string; retriable: boolean }> = {
  insufficient_funds: {
    message: "Your card was declined due to insufficient funds. You can try again or use a different card.",
    retriable: true,
  },
  do_not_honor: {
    message: "Your bank declined this charge. Try again, use a different card, or contact your bank.",
    retriable: true,
  },
  expired_card: {
    message: "This card appears to be expired. Check the expiration date or use a different card.",
    retriable: true,
  },
  incorrect_card: {
    message: "The card details don't match your bank's records. Double-check the card number and expiration date.",
    retriable: true,
  },
  invalid_cvv: {
    message: "The security code (CVV) didn't match. Check the 3–4 digit code and try again.",
    retriable: true,
  },
  over_limit: {
    message: "Your card was declined (over its limit). Try a different card or contact your bank.",
    retriable: true,
  },
  card_not_supported: {
    message: "This card type isn't supported for this purchase. Please try a different card.",
    retriable: true,
  },
  suspected_fraud: {
    // Deliberately neutral — never tell a customer their card is flagged.
    message: "Your bank declined this charge. Please contact your bank or use a different card.",
    retriable: false,
  },
  duplicate_transaction: {
    message: "This looks like a duplicate payment attempt. If you already paid, check your email for a receipt before trying again.",
    retriable: false,
  },
  retry_later: {
    message: "Your bank declined this charge for now. Please try again in a day or two, or use a different card.",
    retriable: true,
  },
  processor_error: {
    message: "The payment processor had a temporary problem. You have not been charged — please try again.",
    retriable: true,
  },
  gateway_error: {
    message: "The payment could not be processed. You have not been charged — please try again.",
    retriable: true,
  },
  generic_decline: {
    message: "Your card was declined. Try again, use a different card, or contact your bank.",
    retriable: true,
  },
};

/** NMI response_code (3-digit) -> normalized decline code. */
const NMI_CODE_MAP: Record<string, DeclineCode> = {
  "200": "generic_decline", // declined by processor
  "201": "do_not_honor",
  "202": "insufficient_funds",
  "203": "over_limit",
  "204": "card_not_supported", // transaction not allowed
  "220": "incorrect_card",
  "221": "incorrect_card", // no such card issuer
  "222": "incorrect_card", // no card number on file with issuer
  "223": "expired_card",
  "224": "incorrect_card", // invalid expiration date
  "225": "invalid_cvv",
  "226": "invalid_cvv", // invalid PIN
  "240": "do_not_honor", // call issuer
  "250": "suspected_fraud", // pickup card
  "251": "suspected_fraud", // lost card
  "252": "suspected_fraud", // stolen card
  "253": "suspected_fraud", // fraudulent card
  "260": "generic_decline",
  "261": "generic_decline",
  "262": "generic_decline",
  "263": "generic_decline",
  "264": "retry_later",
  "300": "gateway_error", // rejected by gateway
  "400": "processor_error",
  "410": "processor_error", // invalid merchant configuration
  "411": "processor_error", // merchant account inactive
  "420": "processor_error", // communication error
  "421": "processor_error",
  "430": "duplicate_transaction",
  "440": "processor_error",
  "441": "processor_error",
  "460": "card_not_supported",
  "461": "card_not_supported",
};

/**
 * Normalize an NMI decline/error into a stable enum + customer-safe message.
 * Falls back to responsetext keyword matching when the code is unmapped.
 */
export function declineInfo(gatewayCode: string, responseText: string): DeclineInfo {
  let code = NMI_CODE_MAP[gatewayCode];
  if (!code) {
    const text = (responseText || "").toLowerCase();
    if (text.includes("insufficient")) code = "insufficient_funds";
    else if (text.includes("expired")) code = "expired_card";
    else if (text.includes("cvv") || text.includes("cvd") || text.includes("security code"))
      code = "invalid_cvv";
    else if (text.includes("duplicate")) code = "duplicate_transaction";
    else if (text.includes("do not honor")) code = "do_not_honor";
    else code = "generic_decline";
  }
  const { message, retriable } = DECLINE_MESSAGES[code];
  return { code, message, retriable };
}

/* ------------------------------------------------------------------ */
/* gateway plumbing                                                    */
/* ------------------------------------------------------------------ */

/** Sanitized subset of the gateway response that is safe to store/log. */
const RAW_ALLOWLIST = [
  "response",
  "responsetext",
  "authcode",
  "transactionid",
  "avsresponse",
  "cvvresponse",
  "orderid",
  "type",
  "response_code",
  "customer_vault_id",
] as const;

export interface GatewayResult {
  status: "approved" | "declined" | "error";
  transactionId: string;
  authCode: string;
  responseText: string;
  /** Raw NMI response_code, e.g. "100", "202", "300". */
  gatewayCode: string;
  avsResponse: string;
  cvvResponse: string;
  customerVaultId?: string;
  decline?: DeclineInfo;
  devMode: boolean;
  /** Allowlisted response fields only — never card data, never the key. */
  raw: Record<string, string>;
}

function parseGatewayBody(body: string): GatewayResult {
  const params = new URLSearchParams(body);
  const raw: Record<string, string> = {};
  for (const key of RAW_ALLOWLIST) {
    const v = params.get(key);
    if (v !== null && v !== "") raw[key] = v;
  }
  const response = params.get("response") ?? "";
  const responseText = params.get("responsetext") ?? "";
  const gatewayCode = params.get("response_code") ?? "";
  const status: GatewayResult["status"] =
    response === "1" ? "approved" : response === "2" ? "declined" : "error";

  return {
    status,
    transactionId: params.get("transactionid") ?? "",
    authCode: params.get("authcode") ?? "",
    responseText,
    gatewayCode,
    avsResponse: params.get("avsresponse") ?? "",
    cvvResponse: params.get("cvvresponse") ?? "",
    customerVaultId: params.get("customer_vault_id") || undefined,
    decline: status === "approved" ? undefined : declineInfo(gatewayCode, responseText),
    devMode: false,
    raw,
  };
}

/** POST params to transact.php and parse the response. Throws on network failure. */
async function gatewayPost(params: URLSearchParams): Promise<GatewayResult> {
  const res = await fetch(nmiEndpoint(), {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params.toString(),
    // NMI responds quickly; fail closed on a hung gateway.
    signal: AbortSignal.timeout(25_000),
  });
  return parseGatewayBody(await res.text());
}

/* ------------------------------------------------------------------ */
/* sale                                                                */
/* ------------------------------------------------------------------ */

export interface ChargeRequest {
  /** USD amount, computed server-side from the state config. */
  amount: number;
  /** Single-use payment_token from client-side tokenization. */
  paymentToken?: string;
  /** OR: stored NMI Customer Vault id (payment retries with card on file). */
  customerVaultId?: string;
  /** Order reference, echoed into the gateway for reconciliation. */
  orderId: string;
  billingZip?: string;
  /** Optional AVS / receipt enrichment — improves approval rates. */
  customer?: { firstName?: string; lastName?: string; email?: string; phone?: string };
  /** Store the card in NMI's Customer Vault (only when vaultEnabled()). */
  addToVault?: boolean;
}

export type ChargeResult =
  | {
      ok: true;
      transactionId: string;
      devMode: boolean;
      customerVaultId?: string;
      gateway?: GatewayResult;
    }
  | {
      ok: false;
      status: "declined" | "error";
      message: string;
      declineCode: DeclineCode;
      retriable: boolean;
      transactionId?: string;
      gateway?: GatewayResult;
    };

/**
 * Charge a tokenized card (or vaulted customer) via NMI type=sale.
 *
 * DEV MODE: when no security key is set, the charge is SIMULATED (clearly
 * logged) so the site works with zero env. Tokens containing "decline"
 * simulate a decline so the failure path is exercisable locally too.
 */
export async function chargeSale(req: ChargeRequest): Promise<ChargeResult> {
  const key = nmiSecurityKey();
  const amount = req.amount.toFixed(2);

  if (!key) {
    if (req.paymentToken?.includes("decline")) {
      const info = DECLINE_MESSAGES.insufficient_funds;
      // eslint-disable-next-line no-console
      console.log(`[nmi:dev] SIMULATED decline of $${amount} (order ${req.orderId})`);
      return {
        ok: false,
        status: "declined",
        message: info.message,
        declineCode: "insufficient_funds",
        retriable: true,
      };
    }
    // eslint-disable-next-line no-console
    console.log(
      `[nmi:dev] no NMI key set — SIMULATED sale of $${amount} ` +
        `(descriptor "${NMI_DESCRIPTOR}", order ${req.orderId})`,
    );
    return {
      ok: true,
      transactionId: `DEV-${Date.now().toString(36).toUpperCase()}`,
      devMode: true,
    };
  }

  const params = new URLSearchParams({
    security_key: key,
    type: "sale",
    amount,
    orderid: req.orderId,
    // Statement descriptor (soft descriptor) shown on the card statement.
    custom_descriptor: NMI_DESCRIPTOR,
  });
  if (req.paymentToken) params.set("payment_token", req.paymentToken);
  else if (req.customerVaultId) params.set("customer_vault_id", req.customerVaultId);
  else {
    return {
      ok: false,
      status: "error",
      message: DECLINE_MESSAGES.gateway_error.message,
      declineCode: "gateway_error",
      retriable: true,
    };
  }
  if (req.billingZip) params.set("zip", req.billingZip);
  if (req.customer?.firstName) params.set("first_name", req.customer.firstName);
  if (req.customer?.lastName) params.set("last_name", req.customer.lastName);
  if (req.customer?.email) params.set("email", req.customer.email);
  if (req.customer?.phone) params.set("phone", req.customer.phone);
  if (req.addToVault && vaultEnabled() && req.paymentToken) {
    params.set("customer_vault", "add_customer");
  }

  let gateway: GatewayResult;
  try {
    gateway = await gatewayPost(params);
  } catch {
    return {
      ok: false,
      status: "error",
      message:
        "We could not reach the payment processor. You have not been charged — please try again.",
      declineCode: "processor_error",
      retriable: true,
    };
  }

  if (gateway.status === "approved") {
    return {
      ok: true,
      transactionId: gateway.transactionId,
      devMode: false,
      customerVaultId: gateway.customerVaultId,
      gateway,
    };
  }

  const info = gateway.decline ?? declineInfo(gateway.gatewayCode, gateway.responseText);
  // Log only decline metadata — never card data.
  // eslint-disable-next-line no-console
  console.log(
    `[nmi] sale ${gateway.status} for order ${req.orderId}: ` +
      `code=${gateway.gatewayCode || "?"} (${info.code}) "${gateway.responseText}"`,
  );
  return {
    ok: false,
    status: gateway.status === "declined" ? "declined" : "error",
    message: info.message,
    declineCode: info.code,
    retriable: info.retriable,
    transactionId: gateway.transactionId || undefined,
    gateway,
  };
}

/* ------------------------------------------------------------------ */
/* refund                                                              */
/* ------------------------------------------------------------------ */

export type RefundResult =
  | { ok: true; transactionId: string; devMode: boolean; gateway?: GatewayResult }
  | { ok: false; message: string; gateway?: GatewayResult };

/**
 * Refund a settled transaction (full when amount omitted, else partial).
 * For unsettled same-day transactions NMI may require type=void; callers can
 * fall back to voidTransaction() when the refund is rejected.
 */
export async function refundTransaction(
  transactionId: string,
  amount?: number,
): Promise<RefundResult> {
  const key = nmiSecurityKey();
  if (!key) {
    // eslint-disable-next-line no-console
    console.log(`[nmi:dev] SIMULATED refund of transaction ${transactionId}`);
    return { ok: true, transactionId: `DEVREF-${Date.now().toString(36)}`, devMode: true };
  }
  const params = new URLSearchParams({
    security_key: key,
    type: "refund",
    transactionid: transactionId,
  });
  if (amount !== undefined) params.set("amount", amount.toFixed(2));

  let gateway: GatewayResult;
  try {
    gateway = await gatewayPost(params);
  } catch {
    return { ok: false, message: "Could not reach the payment processor to issue the refund." };
  }
  if (gateway.status === "approved") {
    return { ok: true, transactionId: gateway.transactionId, devMode: false, gateway };
  }
  return { ok: false, message: gateway.responseText || "Refund was rejected by the gateway.", gateway };
}

/** Void an unsettled (same-day) transaction. */
export async function voidTransaction(transactionId: string): Promise<RefundResult> {
  const key = nmiSecurityKey();
  if (!key) {
    // eslint-disable-next-line no-console
    console.log(`[nmi:dev] SIMULATED void of transaction ${transactionId}`);
    return { ok: true, transactionId: `DEVVOID-${Date.now().toString(36)}`, devMode: true };
  }
  const params = new URLSearchParams({
    security_key: key,
    type: "void",
    transactionid: transactionId,
  });
  let gateway: GatewayResult;
  try {
    gateway = await gatewayPost(params);
  } catch {
    return { ok: false, message: "Could not reach the payment processor to void the charge." };
  }
  if (gateway.status === "approved") {
    return { ok: true, transactionId: gateway.transactionId, devMode: false, gateway };
  }
  return { ok: false, message: gateway.responseText || "Void was rejected by the gateway.", gateway };
}
