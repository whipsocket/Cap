/**
 * Whipsocket fork: who gets Cap's recording length limit.
 *
 * With portal sign-in set up (PORTAL_STAFF_ORG_ID), the staff organization and
 * any organizations the server admin lists in CAP_UNLIMITED_RECORDING_ORG_IDS
 * have no limit; every other organization (clients) gets the free-plan limit
 * (Video.FREE_PLAN_MAX_RECORDING_SECONDS). The list lives in the server's
 * environment, so organizations can't turn it on themselves.
 * Without PORTAL_STAFF_ORG_ID, Cap's own rule applies: Pro owners have no limit.
 */

/** The organizations without a limit, or null when Cap's own rule applies. */
export function unlimitedRecordingOrganizationIds(env: {
	PORTAL_STAFF_ORG_ID?: string;
	CAP_UNLIMITED_RECORDING_ORG_IDS?: string;
}): string[] | null {
	const staff = env.PORTAL_STAFF_ORG_ID?.trim();
	if (!staff) return null;
	const extra = (env.CAP_UNLIMITED_RECORDING_ORG_IDS ?? "")
		.split(",")
		.map((id) => id.trim())
		.filter(Boolean);
	return [...new Set([staff, ...extra])];
}

export function hasUnlimitedRecording(
	organizationId: string | null | undefined,
	unlimitedOrganizationIds: readonly string[] | null | undefined,
	ownerIsPro: boolean,
): boolean {
	if (unlimitedOrganizationIds)
		return !!organizationId && unlimitedOrganizationIds.includes(organizationId);
	return ownerIsPro;
}
