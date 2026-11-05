import { describe, expect, it } from "vitest";
import {
	getPlayerBranding,
	normalizeAccentColor,
	pickPlayerBrandingSettings,
} from "@/lib/player-branding";

describe("player branding", () => {
	it("uses Cap's defaults when nothing is set", () => {
		expect(getPlayerBranding(null, "https://x/icon.png")).toEqual({
			accentColor: null,
			loadingIconUrl: null,
		});
	});

	it("uses the color and the icon when turned on", () => {
		expect(
			getPlayerBranding(
				{ playerAccentColor: "#5EAF8A", playerUseOrganizationIconForLoading: true },
				"https://x/icon.png",
			),
		).toEqual({ accentColor: "#5eaf8a", loadingIconUrl: "https://x/icon.png" });
	});

	it("needs an icon to show one", () => {
		expect(
			getPlayerBranding({ playerUseOrganizationIconForLoading: true }, null)
				.loadingIconUrl,
		).toBeNull();
	});

	it("only accepts #rrggbb colors", () => {
		expect(normalizeAccentColor("#abc")).toBeNull();
		expect(normalizeAccentColor("red")).toBeNull();
		expect(normalizeAccentColor("#12345g")).toBeNull();
		expect(normalizeAccentColor("url(x)")).toBeNull();
		expect(normalizeAccentColor(" #A1B2C3 ")).toBe("#a1b2c3");
	});

	it("picks only the branding keys", () => {
		expect(
			pickPlayerBrandingSettings({
				playerAccentColor: "#000000",
				playerUseOrganizationIconForLoading: false,
				// @ts-expect-error other settings are ignored
				disableComments: true,
			}),
		).toEqual({ playerAccentColor: "#000000", playerUseOrganizationIconForLoading: false });
		expect(pickPlayerBrandingSettings(null)).toEqual({});
	});
});
