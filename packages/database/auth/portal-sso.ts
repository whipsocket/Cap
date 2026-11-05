import { serverEnv } from "@cap/env";
import { Organisation, User } from "@cap/web-domain";
import { and, eq, isNull, like, lt, sql } from "drizzle-orm";
import { nanoId } from "../helpers.ts";
import { db } from "../index.ts";
import {
	organizationMembers,
	organizations,
	users,
	verificationTokens,
} from "../schema.ts";
import { type PortalTokenClaims, verifyPortalToken } from "./portal-token.ts";

/**
 * Sign-in from the Whipsocket portal (see portal-token.ts for the token).
 *
 * - Staff join the agency's organization (PORTAL_STAFF_ORG_ID).
 * - Client contacts join their client's organization, one per portal client,
 *   created on first use and named after the client. Clients never see the
 *   agency's library or other clients' videos.
 * - Accounts are created on first sign-in and skip Cap's onboarding screens.
 * - Each token works once (its id is recorded until it expires).
 */

const REPLAY_PREFIX = "portal-sso:";

/** Records the token id; false if it was already used. */
async function claimTokenOnce(claims: PortalTokenClaims) {
	const database = db();
	await database
		.delete(verificationTokens)
		.where(
			and(
				like(verificationTokens.identifier, `${REPLAY_PREFIX}%`),
				lt(verificationTokens.expires, new Date()),
			),
		);
	try {
		await database.insert(verificationTokens).values({
			identifier: `${REPLAY_PREFIX}${claims.jti}`,
			token: `${REPLAY_PREFIX}${claims.jti}`,
			expires: new Date(claims.exp * 1000),
		});
		return true;
	} catch {
		return false;
	}
}

export async function provisionPortalUser(
	claims: PortalTokenClaims,
	staffOrgId: string | undefined,
) {
	return db().transaction(async (tx) => {
		const now = new Date();
		let [user] = await tx
			.select()
			.from(users)
			.where(eq(users.email, claims.email))
			.for("update");

		let orgId: Organisation.OrganisationId | null = null;
		let orgOwnerId: string | null = null;
		if (claims.account.kind === "staff") {
			if (!staffOrgId) throw new Error("PORTAL_STAFF_ORG_ID is not set.");
			const [org] = await tx
				.select({ id: organizations.id, ownerId: organizations.ownerId })
				.from(organizations)
				.where(
					and(
						eq(organizations.id, Organisation.OrganisationId.make(staffOrgId)),
						isNull(organizations.tombstoneAt),
					),
				)
				.for("update");
			if (!org) throw new Error("The staff organization was not found.");
			orgId = org.id;
			orgOwnerId = org.ownerId;
		} else {
			const [org] = await tx
				.select({ id: organizations.id, ownerId: organizations.ownerId })
				.from(organizations)
				.where(
					and(
						sql`JSON_UNQUOTE(JSON_EXTRACT(${organizations.metadata}, '$.portalClientId')) = ${claims.account.clientId}`,
						isNull(organizations.tombstoneAt),
					),
				)
				.limit(1)
				.for("update");
			if (org) {
				orgId = org.id;
				orgOwnerId = org.ownerId;
			}
		}

		if (!user) {
			const id = User.UserId.make(nanoId());
			await tx.insert(users).values({
				id,
				email: claims.email,
				emailVerified: now,
				name: claims.name || claims.email.split("@")[0],
				activeOrganizationId: Organisation.OrganisationId.make(""),
				marketingOrigin: "teammate",
			});
			[user] = await tx.select().from(users).where(eq(users.id, id)).limit(1);
			if (!user) throw new Error("The user was not created.");
		}

		if (!orgId && claims.account.kind === "client") {
			orgId = Organisation.OrganisationId.make(nanoId());
			orgOwnerId = user.id;
			await tx.insert(organizations).values({
				id: orgId,
				ownerId: user.id,
				name: claims.account.clientName,
				metadata: { portalClientId: claims.account.clientId },
			});
		}
		if (!orgId) throw new Error("No organization for this portal user.");

		const [member] = await tx
			.select({ id: organizationMembers.id })
			.from(organizationMembers)
			.where(
				and(
					eq(organizationMembers.userId, user.id),
					eq(organizationMembers.organizationId, orgId),
				),
			)
			.limit(1);
		if (!member) {
			await tx.insert(organizationMembers).values({
				id: nanoId(),
				userId: user.id,
				organizationId: orgId,
				role: orgOwnerId === user.id ? "owner" : "member",
				hasProSeat: false,
			});
		}

		await tx
			.update(users)
			.set({
				activeOrganizationId: orgId,
				defaultOrgId: user.defaultOrgId || orgId,
				emailVerified: user.emailVerified ?? now,
				...(!user.name && claims.name ? { name: claims.name } : {}),
				onboarding_completed_at: user.onboarding_completed_at ?? now,
				onboardingSteps: {
					...user.onboardingSteps,
					welcome: true,
					organizationSetup: true,
					customDomain: true,
					inviteTeam: true,
					download: true,
				},
			})
			.where(eq(users.id, user.id));

		return {
			id: user.id,
			email: user.email,
			name: user.name || claims.name,
			image: user.image ?? null,
		};
	});
}

/** The portal provider's authorize step: a user to sign in, or null. */
export async function signInWithPortalToken(token: unknown) {
	const env = serverEnv();
	const claims = verifyPortalToken(token, env.PORTAL_SSO_SECRET);
	if (!claims) return null;
	try {
		if (!(await claimTokenOnce(claims))) {
			console.warn("[portal-sso] token already used", { email: claims.email });
			return null;
		}
		return await provisionPortalUser(claims, env.PORTAL_STAFF_ORG_ID);
	} catch (error) {
		console.error("[portal-sso] sign-in failed", {
			email: claims.email,
			error: error instanceof Error ? error.message : String(error),
		});
		return null;
	}
}
