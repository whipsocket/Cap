import type { Metadata } from "next";
import CapSettingsCard from "../components/CapSettingsCard";
import { DefaultVideoVisibility } from "../components/DefaultVideoVisibility";
import { PlayerBrandingCard } from "../components/PlayerBrandingCard";

export const metadata: Metadata = {
	title: "Organization Preferences — Cap",
};

export default function PreferencesPage() {
	return (
		<div className="space-y-6">
			<DefaultVideoVisibility />
			<PlayerBrandingCard />
			<CapSettingsCard />
		</div>
	);
}
