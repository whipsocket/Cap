/**
 * Whipsocket fork: who gets Cap's recording length limit.
 *
 * With portal sign-in set up (PORTAL_STAFF_ORG_ID), recordings in the staff
 * organization have no limit and every other organization (clients) gets the
 * free-plan limit (Video.FREE_PLAN_MAX_RECORDING_SECONDS). Without it, Cap's
 * own rule applies: Pro owners have no limit.
 */
export function hasUnlimitedRecording(
	organizationId: string | null | undefined,
	staffOrganizationId: string | null | undefined,
	ownerIsPro: boolean,
): boolean {
	const staff = staffOrganizationId?.trim();
	if (staff) return !!organizationId && organizationId === staff;
	return ownerIsPro;
}
