import { serverEnv } from "@cap/env";
import { portalOriginFrom } from "@/lib/portal-bridge";
import { PortalSignIn } from "./PortalSignIn";

export const dynamic = "force-dynamic";

/** Whipsocket fork: sign-in from the portal (see PortalSignIn). */
export default function PortalSignInPage() {
	return <PortalSignIn portalOrigin={portalOriginFrom(serverEnv().PORTAL_URL)} />;
}
