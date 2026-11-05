"use server";

import { db } from "@cap/database";
import { getCurrentUser } from "@cap/database/auth/session";
import { organizations } from "@cap/database/schema";
import type { Organisation } from "@cap/web-domain";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { normalizeAccentColor } from "@/lib/player-branding";
import { requireOrganizationSettingsManager } from "./authorization";

/**
 * Whipsocket fork: save an organization's player branding. Only the two branding
 * keys change; every other setting is left as stored.
 */
export async function updatePlayerBranding(
	organizationId: Organisation.OrganisationId,
	input: { accentColor: string | null; useOrganizationIconForLoading: boolean },
) {
	const user = await getCurrentUser();
	if (!user) throw new Error("Unauthorized");
	await requireOrganizationSettingsManager(user.id, organizationId);

	const accentColor =
		input.accentColor === null ? null : normalizeAccentColor(input.accentColor);
	if (input.accentColor !== null && !accentColor)
		throw new Error("Pick a color like #1d2a32.");

	const [organization] = await db()
		.select({ settings: organizations.settings })
		.from(organizations)
		.where(eq(organizations.id, organizationId));
	if (!organization) throw new Error("Organization not found");

	const { playerAccentColor: _old, ...rest } = organization.settings ?? {};
	await db()
		.update(organizations)
		.set({
			settings: {
				...rest,
				...(accentColor ? { playerAccentColor: accentColor } : {}),
				playerUseOrganizationIconForLoading: input.useOrganizationIconForLoading,
			},
		})
		.where(eq(organizations.id, organizationId));

	revalidatePath("/dashboard/settings/organization");
	return { success: true };
}
