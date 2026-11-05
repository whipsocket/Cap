"use client";

import { signIn } from "next-auth/react";
import { useEffect, useRef, useState } from "react";
import { rememberPortalOrigin } from "@/lib/portal-bridge";
import { getSafeNextPath } from "../../safe-next";

/**
 * Whipsocket fork: sign-in from the portal. The portal opens
 * /login/portal#token=<signed token>&next=<path>. The token stays in the URL
 * fragment (never sent to the server or logs) and is removed from the address
 * bar before it's used.
 */
export function PortalSignIn({ portalOrigin }: { portalOrigin: string | null }) {
	const [failed, setFailed] = useState(false);
	const started = useRef(false);

	useEffect(() => {
		if (started.current) return;
		started.current = true;

		const params = new URLSearchParams(window.location.hash.slice(1));
		const token = params.get("token");
		const next = getSafeNextPath(params.get("next"), window.location.origin);
		window.history.replaceState(null, "", window.location.pathname);

		if (!token) {
			setFailed(true);
			return;
		}
		// Where finished recordings go back to (this tab only).
		rememberPortalOrigin(portalOrigin);
		signIn("portal", { token, redirect: false })
			.then((result) => {
				if (result?.ok && !result.error) window.location.replace(next);
				else setFailed(true);
			})
			.catch(() => setFailed(true));
	}, [portalOrigin]);

	return (
		<div className="flex justify-center items-center px-4 min-h-screen bg-gray-2">
			<div className="max-w-sm text-center">
				{failed ? (
					<>
						<h1 className="mb-2 text-lg font-medium text-gray-12">
							This sign-in link didn't work
						</h1>
						<p className="text-sm text-gray-10">
							Links from the portal work once and only for a few minutes. Go
							back to the portal and click Record again.
						</p>
					</>
				) : (
					<p className="text-sm text-gray-10">Signing you in…</p>
				)}
			</div>
		</div>
	);
}
