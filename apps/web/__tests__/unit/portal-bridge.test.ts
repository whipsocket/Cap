import { afterEach, describe, expect, it, vi } from "vitest";
import {
	notifyPortalRecording,
	PORTAL_RECORDING_MESSAGE,
	portalOriginFrom,
	rememberPortalOrigin,
} from "@/lib/portal-bridge";

describe("portal bridge", () => {
	afterEach(() => {
		vi.unstubAllGlobals();
	});

	it("only accepts an https portal address (or localhost)", () => {
		expect(portalOriginFrom("https://portal.whipsocket.com/tickets")).toBe(
			"https://portal.whipsocket.com",
		);
		expect(portalOriginFrom("http://localhost:5173")).toBe(
			"http://localhost:5173",
		);
		expect(portalOriginFrom("http://portal.whipsocket.com")).toBeNull();
		expect(portalOriginFrom("not a url")).toBeNull();
		expect(portalOriginFrom(undefined)).toBeNull();
	});

	const stubWindow = (opener: unknown) => {
		const store = new Map<string, string>();
		vi.stubGlobal("window", {
			opener,
			sessionStorage: {
				getItem: (k: string) => store.get(k) ?? null,
				setItem: (k: string, v: string) => store.set(k, v),
			},
		});
	};

	it("posts the recording to the opener, addressed to the portal origin only", () => {
		const postMessage = vi.fn();
		stubWindow({ closed: false, postMessage });
		rememberPortalOrigin("https://portal.whipsocket.com");
		expect(
			notifyPortalRecording({ videoId: "v1", shareUrl: "https://video/s/v1" }),
		).toBe(true);
		expect(postMessage).toHaveBeenCalledWith(
			{
				type: PORTAL_RECORDING_MESSAGE,
				videoId: "v1",
				shareUrl: "https://video/s/v1",
			},
			"https://portal.whipsocket.com",
		);
	});

	it("does nothing without a remembered origin or an open opener", () => {
		const postMessage = vi.fn();
		stubWindow({ closed: false, postMessage });
		expect(notifyPortalRecording({ videoId: "v1", shareUrl: "x" })).toBe(false);

		stubWindow(null);
		rememberPortalOrigin("https://portal.whipsocket.com");
		expect(notifyPortalRecording({ videoId: "v1", shareUrl: "x" })).toBe(false);

		stubWindow({ closed: true, postMessage });
		rememberPortalOrigin("https://portal.whipsocket.com");
		expect(notifyPortalRecording({ videoId: "v1", shareUrl: "x" })).toBe(false);
		expect(postMessage).not.toHaveBeenCalled();
	});
});
