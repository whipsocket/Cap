/**
 * Whipsocket fork: hands a finished recording back to the portal.
 *
 * The portal opens Cap in a popup (/login/portal → /dashboard/caps/record?portal=1).
 * When a recording finishes, the popup posts { videoId, shareUrl } to the window
 * that opened it. Messages are only ever delivered to the portal's own origin
 * (PORTAL_URL on the server, remembered for this tab at sign-in), so another
 * site that opens Cap can't receive them.
 */

const ORIGIN_KEY = "whipsocket.portalOrigin";
export const PORTAL_RECORDING_MESSAGE = "whipsocket:cap-recording";

export type PortalRecordingMessage = {
	type: typeof PORTAL_RECORDING_MESSAGE;
	videoId: string;
	shareUrl: string;
};

/** The portal origin to talk to, or null when PORTAL_URL isn't a valid URL. */
export function portalOriginFrom(url: string | null | undefined): string | null {
	if (!url?.trim()) return null;
	try {
		const parsed = new URL(url.trim());
		return parsed.protocol === "https:" || parsed.hostname === "localhost"
			? parsed.origin
			: null;
	} catch {
		return null;
	}
}

export function rememberPortalOrigin(origin: string | null) {
	try {
		if (origin) window.sessionStorage.setItem(ORIGIN_KEY, origin);
	} catch {}
}

function rememberedPortalOrigin(): string | null {
	try {
		return window.sessionStorage.getItem(ORIGIN_KEY);
	} catch {
		return null;
	}
}

/** Sends the recording to the portal window. True if it was sent. */
export function notifyPortalRecording(video: {
	videoId: string;
	shareUrl: string;
}): boolean {
	const origin = rememberedPortalOrigin();
	const opener = window.opener as Window | null;
	if (!origin || !opener || opener.closed) return false;
	const message: PortalRecordingMessage = {
		type: PORTAL_RECORDING_MESSAGE,
		videoId: video.videoId,
		shareUrl: video.shareUrl,
	};
	opener.postMessage(message, origin);
	return true;
}
