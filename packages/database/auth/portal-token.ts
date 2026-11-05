import crypto from "node:crypto";

/**
 * Whipsocket portal sign-in tokens.
 *
 * The portal signs a short-lived token for the logged-in portal user and opens
 * Cap at /login/portal#token=...; Cap verifies it with the shared secret
 * (PORTAL_SSO_SECRET) and signs that person in, creating the account if needed.
 *
 * Format: `v1.<base64url(JSON claims)>.<base64url(HMAC-SHA256(secret, "v1.<claims>"))>`
 */

export const PORTAL_TOKEN_VERSION = "v1";
/** Longest lifetime a token may claim (exp - iat). */
export const PORTAL_TOKEN_MAX_LIFETIME_SECONDS = 300;
/** Allowed clock difference between the portal and Cap. */
const CLOCK_SKEW_SECONDS = 60;

export type PortalAccount =
	| { kind: "staff" }
	| { kind: "client"; clientId: string; clientName: string };

export type PortalTokenClaims = {
	email: string;
	name: string | null;
	account: PortalAccount;
	iat: number;
	exp: number;
	jti: string;
};

const sign = (body: string, secret: string) =>
	crypto.createHmac("sha256", secret).update(body).digest("base64url");

/** Builds a token (the portal does the same; used here by tests). */
export function signPortalToken(claims: PortalTokenClaims, secret: string) {
	const body = `${PORTAL_TOKEN_VERSION}.${Buffer.from(JSON.stringify(claims)).toString("base64url")}`;
	return `${body}.${sign(body, secret)}`;
}

const isString = (v: unknown, max: number): v is string =>
	typeof v === "string" && v.length > 0 && v.length <= max;

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function parseAccount(value: unknown): PortalAccount | null {
	if (!value || typeof value !== "object") return null;
	const a = value as Record<string, unknown>;
	if (a.kind === "staff") return { kind: "staff" };
	if (a.kind === "client" && isString(a.clientId, 64) && isString(a.clientName, 255))
		return { kind: "client", clientId: a.clientId, clientName: a.clientName };
	return null;
}

/**
 * Checks the signature, version, lifetime and shape. Returns the claims, or null
 * for anything invalid (never throws). Does not check single use; the caller does.
 */
export function verifyPortalToken(
	token: unknown,
	secret: string | undefined,
	nowSeconds = Math.floor(Date.now() / 1000),
): PortalTokenClaims | null {
	if (!secret?.trim() || typeof token !== "string" || token.length > 4096)
		return null;
	const parts = token.split(".");
	if (parts.length !== 3 || parts[0] !== PORTAL_TOKEN_VERSION) return null;
	const [version, payload, signature] = parts as [string, string, string];

	const expected = Buffer.from(sign(`${version}.${payload}`, secret));
	const provided = Buffer.from(signature);
	if (
		expected.length !== provided.length ||
		!crypto.timingSafeEqual(expected, provided)
	)
		return null;

	let raw: Record<string, unknown>;
	try {
		raw = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
	} catch {
		return null;
	}
	if (!raw || typeof raw !== "object") return null;

	const { email, name, iat, exp, jti } = raw;
	const account = parseAccount(raw.account);
	if (!account) return null;
	if (!isString(email, 255) || !EMAIL.test(email)) return null;
	if (name !== null && name !== undefined && !isString(name, 255)) return null;
	if (!isString(jti, 64) || jti.length < 16) return null;
	if (typeof iat !== "number" || typeof exp !== "number") return null;
	if (!Number.isInteger(iat) || !Number.isInteger(exp)) return null;
	if (exp <= iat || exp - iat > PORTAL_TOKEN_MAX_LIFETIME_SECONDS) return null;
	if (iat > nowSeconds + CLOCK_SKEW_SECONDS) return null;
	if (exp <= nowSeconds) return null;

	return {
		email: email.trim().toLowerCase(),
		name: typeof name === "string" ? name.trim() : null,
		account,
		iat,
		exp,
		jti,
	};
}
