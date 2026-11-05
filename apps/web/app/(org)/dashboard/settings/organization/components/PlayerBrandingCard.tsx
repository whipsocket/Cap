"use client";

import {
	Button,
	Card,
	CardDescription,
	CardHeader,
	CardTitle,
	LogoSpinner,
	Switch,
} from "@cap/ui";
import { Play } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { updatePlayerBranding } from "@/actions/organization/player-branding";
import { normalizeAccentColor } from "@/lib/player-branding";
import { useDashboardContext } from "../../../Contexts";

/**
 * Whipsocket fork: Settings → Organization → Preferences → Player branding.
 * The loading icon and accent color for videos this organization owns, on
 * share links, embeds and the Whipsocket portal.
 */
export function PlayerBrandingCard() {
	const { activeOrganization } = useDashboardContext();
	const organization = activeOrganization?.organization;
	if (!organization) return null;
	return <PlayerBrandingForm key={organization.id} />;
}

const DEFAULT_SWATCH = "#3b82f6";

function PlayerBrandingForm() {
	const router = useRouter();
	const { activeOrganization } = useDashboardContext();
	const organization = activeOrganization!.organization;
	const settings = organization.settings;
	const iconUrl = organization.iconUrl;

	const savedColor = normalizeAccentColor(settings?.playerAccentColor);
	const savedUseIcon = !!settings?.playerUseOrganizationIconForLoading;
	const [color, setColor] = useState<string | null>(savedColor);
	const [useIcon, setUseIcon] = useState(savedUseIcon);
	const [saving, setSaving] = useState(false);

	const dirty = color !== savedColor || useIcon !== savedUseIcon;
	const swatch = color ?? DEFAULT_SWATCH;

	const save = async () => {
		setSaving(true);
		try {
			await updatePlayerBranding(organization.id, {
				accentColor: color,
				useOrganizationIconForLoading: useIcon,
			});
			toast.success("Player branding saved");
			router.refresh();
		} catch (error) {
			toast.error(
				error instanceof Error ? error.message : "Couldn't save the branding.",
			);
		} finally {
			setSaving(false);
		}
	};

	return (
		<Card className="flex flex-col gap-6 w-full">
			<CardHeader>
				<CardTitle>Player branding</CardTitle>
				<CardDescription>
					How videos owned by this organization look on share links, embeds
					and in the portal.
				</CardDescription>
			</CardHeader>

			<div className="grid grid-cols-1 gap-3 md:grid-cols-2">
				<div className="flex gap-6 justify-between items-center p-4 rounded-xl border bg-gray-2 border-gray-3">
					<div className="flex flex-col flex-1 gap-1">
						<p className="text-sm text-gray-12">Loading icon</p>
						<p className="text-xs text-gray-10">
							{iconUrl
								? "Show the organization icon (gently pulsing) while a video loads, instead of the Cap spinner."
								: "Upload an organization icon in General settings first."}
						</p>
					</div>
					<Switch
						disabled={!iconUrl}
						checked={useIcon && !!iconUrl}
						onCheckedChange={(checked: boolean) => setUseIcon(checked)}
					/>
				</div>

				<div className="flex gap-6 justify-between items-center p-4 rounded-xl border bg-gray-2 border-gray-3">
					<div className="flex flex-col flex-1 gap-1">
						<p className="text-sm text-gray-12">Accent color</p>
						<p className="text-xs text-gray-10">
							The play button and progress bar.{" "}
							{color ? (
								<button
									type="button"
									className="underline text-gray-11 hover:text-gray-12"
									onClick={() => setColor(null)}
								>
									Reset to Cap default
								</button>
							) : (
								"Using Cap's default."
							)}
						</p>
					</div>
					<div className="flex gap-2 items-center">
						<input
							type="color"
							aria-label="Accent color"
							className="p-1 w-12 h-9 rounded-lg border cursor-pointer bg-gray-1 border-gray-3"
							value={swatch}
							onChange={(e) => setColor(e.target.value.toLowerCase())}
						/>
						<span className="font-mono text-xs text-gray-10 w-[60px]">
							{color ?? "default"}
						</span>
					</div>
				</div>
			</div>

			<div className="flex gap-6 items-center p-4 rounded-xl border bg-gray-2 border-gray-3">
				<p className="text-xs text-gray-10">Preview</p>
				<div className="flex gap-6 items-center">
					{useIcon && iconUrl ? (
						// biome-ignore lint/performance/noImgElement: tiny preview
						<img
							src={iconUrl}
							alt=""
							className="object-contain rounded-lg animate-pulse size-10"
						/>
					) : (
						<LogoSpinner className="w-10 h-auto animate-spin" />
					)}
					<span
						className="flex justify-center items-center rounded-full size-12"
						style={{ backgroundColor: swatch }}
					>
						<Play className="text-white size-5" fill="white" />
					</span>
					<span className="relative w-40 h-1 rounded-full bg-gray-6">
						<span
							className="absolute inset-y-0 left-0 w-2/5 rounded-full"
							style={{ backgroundColor: color ?? "white" }}
						/>
					</span>
				</div>
			</div>

			<div>
				<Button
					variant="dark"
					size="sm"
					disabled={!dirty || saving}
					onClick={save}
				>
					{saving ? "Saving…" : "Save"}
				</Button>
			</div>
		</Card>
	);
}
