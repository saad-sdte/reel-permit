"use client";

/**
 * Client-side card tokenization (NMI Collect.js).
 *
 * Collect.js does NOT accept raw card numbers from our DOM — it only tokenizes
 * via its hosted lightbox / iframes. Calling a fictional CollectJS.tokenize()
 * always fails once NEXT_PUBLIC_NMI_TOKENIZATION_KEY is set.
 *
 * Modes:
 *  - CONFIGURED: load Collect.js → lightbox → payment_token
 *  - DEV (key unset): simulate tok_dev_* so local checkout works
 */

export interface CardDetails {
  number: string; // digits only — used in DEV mode only
  expMonth: string; // "MM"
  expYear: string; // "YYYY"
  cvv: string;
}

export interface TokenizedCard {
  token: string;
  last4: string;
  brand: string;
}

interface CollectJsCard {
  number?: string;
  bin?: string;
  exp?: string;
  type?: string;
}

interface CollectJsResponse {
  token?: string;
  tokenType?: string;
  card?: CollectJsCard;
}

interface CollectJsGlobal {
  configure?: (opts: Record<string, unknown>) => void;
  startPaymentRequest?: (event?: Event) => void;
  closePaymentRequest?: () => void;
}

export type InlineField = "ccnumber" | "ccexp" | "cvv";

declare global {
  interface Window {
    CollectJS?: CollectJsGlobal;
  }
}

let collectJsPromise: Promise<void> | null = null;

/** True when a real NMI public tokenization key is baked into the client bundle. */
export function nmiBrowserConfigured(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_NMI_TOKENIZATION_KEY?.trim());
}

/** Inject the Collect.js script once, keyed by the public tokenization key. */
function loadCollectJs(tokenizationKey: string): Promise<void> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("collectjs-ssr"));
  }
  if (window.CollectJS?.configure && window.CollectJS?.startPaymentRequest) {
    return Promise.resolve();
  }
  if (collectJsPromise) return collectJsPromise;

  collectJsPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(
      'script[src="https://secure.networkmerchants.com/token/Collect.js"]',
    );
    if (existing && window.CollectJS) {
      resolve();
      return;
    }

    const script = document.createElement("script");
    script.src = "https://secure.networkmerchants.com/token/Collect.js";
    script.async = true;
    // Public tokenization key only — safe for the browser by design.
    // Use the exact data attribute shape NMI expects for its loader.
    script.setAttribute("data-tokenization-key", tokenizationKey);
    script.onload = () => {
      // Collect.js attaches CollectJS asynchronously after onload in some builds.
      const start = Date.now();
      const waitReady = () => {
        if (window.CollectJS?.configure && window.CollectJS?.startPaymentRequest) {
          resolve();
          return;
        }
        if (Date.now() - start > 8000) {
          collectJsPromise = null;
          reject(new Error("collectjs-unavailable"));
          return;
        }
        requestAnimationFrame(waitReady);
      };
      waitReady();
    };
    script.onerror = () => {
      collectJsPromise = null;
      reject(new Error("collectjs-load-failed"));
    };
    document.head.appendChild(script);
  });
  return collectJsPromise;
}

function last4FromMasked(number?: string): string {
  if (!number) return "";
  const digits = number.replace(/\D/g, "");
  return digits.slice(-4);
}

/**
 * Open NMI's hosted lightbox and resolve with a single-use payment_token.
 * Card data never touches our DOM or servers.
 */
async function tokenizeViaLightbox(): Promise<TokenizedCard> {
  const tokenizationKey = process.env.NEXT_PUBLIC_NMI_TOKENIZATION_KEY?.trim();
  if (!tokenizationKey) throw new Error("tokenization-key-missing");

  await loadCollectJs(tokenizationKey);

  return new Promise<TokenizedCard>((resolve, reject) => {
    let settled = false;
    const finish = (fn: () => void) => {
      if (settled) return;
      settled = true;
      fn();
    };

    try {
      window.CollectJS!.configure!({
        callback: (response: CollectJsResponse) => {
          const token = response?.token?.trim();
          if (!token) {
            finish(() => reject(new Error("collectjs-token-empty")));
            return;
          }
          finish(() =>
            resolve({
              token,
              last4: last4FromMasked(response.card?.number),
              brand: response.card?.type ?? "",
            }),
          );
        },
      });
      window.CollectJS!.startPaymentRequest!();
    } catch (err) {
      finish(() =>
        reject(err instanceof Error ? err : new Error("collectjs-configure-failed")),
      );
    }
  });
}

/**
 * Inline (embedded) Collect.js integration.
 *
 * Instead of NMI's default lightbox popup, Collect.js mounts secure PCI iframes
 * INSIDE our own styled field containers (`selectors`), so the card entry looks
 * like the rest of the form. Same PCI-SAQ-A posture as the lightbox — the PAN,
 * expiry, and CVV live only inside NMI's iframes and never touch our DOM/servers.
 */
export interface InlineInitOptions {
  selectors: Record<InlineField, string>;
  onToken: (card: TokenizedCard) => void;
  onError: (message: string) => void;
  onValidity?: (field: InlineField, valid: boolean, message: string) => void;
  onReady?: () => void;
  onTimeout?: () => void;
}

function mapCollectField(raw: string): InlineField | null {
  if (raw.includes("ccnumber") || raw.includes("ccnum")) return "ccnumber";
  if (raw.includes("ccexp")) return "ccexp";
  if (raw.includes("cvv")) return "cvv";
  return null;
}

/**
 * Load Collect.js and configure it in inline mode against the given field
 * containers. Resolves once configuration has been requested; the iframes become
 * usable when `onReady` (fieldsAvailableCallback) fires.
 */
export async function initInlineCollectJs(opts: InlineInitOptions): Promise<void> {
  const tokenizationKey = process.env.NEXT_PUBLIC_NMI_TOKENIZATION_KEY?.trim();
  if (!tokenizationKey) throw new Error("tokenization-key-missing");

  await loadCollectJs(tokenizationKey);

  window.CollectJS!.configure!({
    variant: "inline",
    // Don't copy styles from sibling inputs; we provide explicit CSS below.
    styleSniffer: false,
    fields: {
      ccnumber: {
        selector: opts.selectors.ccnumber,
        title: "Card Number",
        placeholder: "1234 5678 9012 3456",
        enableCardBrandPreviews: true,
      },
      ccexp: {
        selector: opts.selectors.ccexp,
        title: "Expiration Date",
        placeholder: "MM / YY",
      },
      cvv: {
        selector: opts.selectors.cvv,
        title: "Security Code",
        placeholder: "CVV",
      },
    },
    // Only the inner text is styled here; the container border/padding is ours.
    customCss: {
      color: "#0f172a",
      "font-size": "16px",
      "font-family": "inherit",
      "line-height": "1.5",
    },
    focusCss: { color: "#0f172a" },
    invalidCss: { color: "#dc2626" },
    placeholderCss: { color: "#94a3b8" },
    validationCallback: (field: string, status: boolean, message: string) => {
      const mapped = mapCollectField(field);
      if (mapped) opts.onValidity?.(mapped, status, message);
    },
    fieldsAvailableCallback: () => opts.onReady?.(),
    timeoutDuration: 15000,
    timeoutCallback: () => opts.onTimeout?.(),
    callback: (response: CollectJsResponse) => {
      const token = response?.token?.trim();
      if (!token) {
        opts.onError("We couldn't securely process your card details. Please try again.");
        return;
      }
      opts.onToken({
        token,
        last4: last4FromMasked(response.card?.number),
        brand: response.card?.type ?? "",
      });
    },
  });
}

/** Trigger inline validation + tokenization; the token arrives via `onToken`. */
export function submitInlinePayment(): void {
  window.CollectJS?.startPaymentRequest?.();
}

function tokenizeDev(card: CardDetails): TokenizedCard {
  const last4 = card.number.slice(-4);
  const random = new Uint8Array(8);
  crypto.getRandomValues(random);
  const suffix = Array.from(random, (b) => (b % 36).toString(36)).join("");
  return { token: `tok_dev_${suffix}`, last4, brand: "" };
}

/**
 * Tokenize card details. Resolves with { token, last4, brand }.
 * Rejects with a user-friendly Error message (never containing card data).
 *
 * When NMI is configured, `card` is ignored — Collect.js lightbox collects
 * the PAN. Pass card details only for local DEV mode (no public key).
 */
export async function tokenizeCard(card?: CardDetails): Promise<TokenizedCard> {
  if (nmiBrowserConfigured()) {
    try {
      return await tokenizeViaLightbox();
    } catch (err) {
      const detail = err instanceof Error ? err.message : "unknown";
      console.error(`[payment-client] Collect.js tokenization failed: ${detail}`);
      const safeMessage =
        process.env.NODE_ENV !== "production"
          ? `We couldn't securely process your card details. Please try again in a moment. (${detail})`
          : "We couldn't securely process your card details. Please try again in a moment.";
      throw new Error(safeMessage);
    }
  }

  if (!card?.number) {
    throw new Error("Card details are required.");
  }
  return tokenizeDev(card);
}
