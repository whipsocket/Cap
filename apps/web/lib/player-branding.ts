/**
 * Whipsocket fork: per-organization player branding (Settings → Organization →
 * Player branding). Stored in organizations.settings; applies to the share page
 * and the embed of every video the organization owns.
 */

export type PlayerBranding = {
	/** Play button and progress bar color, or null for Cap's default. */
	accentColor: string | null;
	/** Image shown (pulsing) while the video loads, or null for Cap's spinner. */
	loadingIconUrl: string | null;
};

export const DEFAULT_PLAYER_BRANDING: PlayerBranding = {
	accentColor: null,
	loadingIconUrl: null,
};

/** The settings keys this feature owns. */
export const PLAYER_BRANDING_KEYS = [
	"playerAccentColor",
	"playerUseOrganizationIconForLoading",
] as const;

export type PlayerBrandingSettings = {
	playerAccentColor?: string;
	playerUseOrganizationIconForLoading?: boolean;
};

const HEX = /^#[0-9a-f]{6}$/i;

export const normalizeAccentColor = (value: unknown): string | null =>
	typeof value === "string" && HEX.test(value.trim())
		? value.trim().toLowerCase()
		: null;

export function getPlayerBranding(
	settings: PlayerBrandingSettings | null | undefined,
	organizationIconUrl: string | null | undefined,
): PlayerBranding {
	return {
		accentColor: normalizeAccentColor(settings?.playerAccentColor),
		loadingIconUrl:
			settings?.playerUseOrganizationIconForLoading && organizationIconUrl
				? organizationIconUrl
				: null,
	};
}

/** Just this feature's keys from a settings object (missing ones left out). */
export function pickPlayerBrandingSettings(
	settings: PlayerBrandingSettings | null | undefined,
): PlayerBrandingSettings {
	const out: PlayerBrandingSettings = {};
	const color = normalizeAccentColor(settings?.playerAccentColor);
	if (color) out.playerAccentColor = color;
	if (typeof settings?.playerUseOrganizationIconForLoading === "boolean")
		out.playerUseOrganizationIconForLoading =
			settings.playerUseOrganizationIconForLoading;
	return out;
}
