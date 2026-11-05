import type { Metadata } from "next";
import { RecordVideoPage } from "./RecordVideoPage";

export const metadata: Metadata = {
	title: "Record a Cap",
};

export default async function RecordVideoRoute(props: {
	searchParams: Promise<{ portal?: string | string[] }>;
}) {
	const { portal } = await props.searchParams;
	// Whipsocket fork: ?portal=1 when opened from the portal's Record button.
	return <RecordVideoPage portalMode={portal === "1"} />;
}
