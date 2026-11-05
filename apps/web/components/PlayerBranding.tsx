"use client";

import { LogoSpinner } from "@cap/ui";
import clsx from "clsx";
import { createContext, type ReactNode, useContext } from "react";
import {
	DEFAULT_PLAYER_BRANDING,
	type PlayerBranding,
} from "@/lib/player-branding";

/** Whipsocket fork: the video owner's organization branding, for the player. */
const PlayerBrandingContext = createContext<PlayerBranding>(
	DEFAULT_PLAYER_BRANDING,
);

export function PlayerBrandingProvider({
	value,
	children,
}: {
	value: PlayerBranding | null | undefined;
	children: ReactNode;
}) {
	return (
		<PlayerBrandingContext.Provider value={value ?? DEFAULT_PLAYER_BRANDING}>
			{children}
		</PlayerBrandingContext.Provider>
	);
}

export const usePlayerBranding = () => useContext(PlayerBrandingContext);

/** Background color style for accented controls; undefined keeps Cap's default. */
export const useAccentBackground = () => {
	const { accentColor } = usePlayerBranding();
	return accentColor ? { backgroundColor: accentColor } : undefined;
};

/** The loading indicator: the organization's icon (pulsing) or Cap's spinner. */
export function PlayerLoadingIcon({ className }: { className?: string }) {
	const { loadingIconUrl } = usePlayerBranding();
	if (!loadingIconUrl) return <LogoSpinner className={className ?? ""} />;
	return (
		// biome-ignore lint/performance/noImgElement: tiny remote icon
		<img
			src={loadingIconUrl}
			alt=""
			className={clsx(
				"object-contain rounded-lg animate-pulse size-8 sm:size-10",
			)}
		/>
	);
}
