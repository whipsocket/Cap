import {
	type PortalTokenClaims,
	signPortalToken,
	verifyPortalToken,
} from "@cap/database/auth/portal-token";
import { describe, expect, it } from "vitest";

const SECRET = "test-secret-0123456789";
const NOW = 1_800_000_000;

const claims = (over: Partial<PortalTokenClaims> = {}): PortalTokenClaims => ({
	email: "Jane@Example.com",
	name: "Jane Cooper",
	account: { kind: "client", clientId: "c_123", clientName: "Acme Co" },
	iat: NOW,
	exp: NOW + 120,
	jti: "0123456789abcdef0123",
	...over,
});

describe("portal sign-in tokens", () => {
	it("accepts a valid token and normalizes the email", () => {
		const out = verifyPortalToken(signPortalToken(claims(), SECRET), SECRET, NOW);
		expect(out).toMatchObject({
			email: "jane@example.com",
			name: "Jane Cooper",
			account: { kind: "client", clientId: "c_123", clientName: "Acme Co" },
		});
	});

	it("accepts staff tokens", () => {
		const t = signPortalToken(claims({ account: { kind: "staff" } }), SECRET);
		expect(verifyPortalToken(t, SECRET, NOW)?.account).toEqual({ kind: "staff" });
	});

	it("rejects a wrong secret, a tampered body, or a missing secret", () => {
		const t = signPortalToken(claims(), SECRET);
		expect(verifyPortalToken(t, "other-secret", NOW)).toBeNull();
		expect(verifyPortalToken(t, undefined, NOW)).toBeNull();
		expect(verifyPortalToken(t, "   ", NOW)).toBeNull();

		const [v, , sig] = t.split(".");
		const forged = Buffer.from(
			JSON.stringify({ ...claims(), account: { kind: "staff" } }),
		).toString("base64url");
		expect(verifyPortalToken(`${v}.${forged}.${sig}`, SECRET, NOW)).toBeNull();
	});

	it("rejects expired, future-dated and long-lived tokens", () => {
		const sign = (o: Partial<PortalTokenClaims>) =>
			signPortalToken(claims(o), SECRET);
		expect(verifyPortalToken(sign({}), SECRET, NOW + 121)).toBeNull();
		expect(
			verifyPortalToken(sign({ iat: NOW + 600, exp: NOW + 700 }), SECRET, NOW),
		).toBeNull();
		expect(verifyPortalToken(sign({ exp: NOW + 301 }), SECRET, NOW)).toBeNull();
	});

	it("rejects bad shapes", () => {
		const sign = (o: Record<string, unknown>) =>
			signPortalToken({ ...claims(), ...o } as PortalTokenClaims, SECRET);
		expect(verifyPortalToken(sign({ email: "not-an-email" }), SECRET, NOW)).toBeNull();
		expect(verifyPortalToken(sign({ jti: "short" }), SECRET, NOW)).toBeNull();
		expect(
			verifyPortalToken(sign({ account: { kind: "client" } }), SECRET, NOW),
		).toBeNull();
		expect(verifyPortalToken(sign({ account: { kind: "admin" } }), SECRET, NOW)).toBeNull();
		expect(verifyPortalToken("v2.a.b", SECRET, NOW)).toBeNull();
		expect(verifyPortalToken("garbage", SECRET, NOW)).toBeNull();
		expect(verifyPortalToken(42, SECRET, NOW)).toBeNull();
	});
});
