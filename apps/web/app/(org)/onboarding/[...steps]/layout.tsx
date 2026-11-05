import { getCurrentUser } from "@cap/database/auth/session";
import { redirect } from "next/navigation";

export default async function OnboardingStepLayout({
	children,
	params,
}: {
	children: React.ReactNode;
	params: Promise<{ steps: string[] }>;
}) {
	const user = await getCurrentUser();

	if (!user) {
		redirect("/login");
	}

	const steps = user.onboardingSteps || {};
	const currentStep = (await params).steps?.[0] ?? "welcome";

	const ordered = [
		"welcome",
		"organization-setup",
		"custom-domain",
		"invite-team",
		"download",
	] as const;
	const isComplete = (s: (typeof ordered)[number]) =>
		s === "welcome"
			? Boolean(steps.welcome && user.name)
			: s === "organization-setup"
				? Boolean(steps.organizationSetup)
				: s === "custom-domain"
					? Boolean(steps.customDomain)
					: s === "invite-team"
						? Boolean(steps.inviteTeam)
						: Boolean(steps.download);

	// Whipsocket fork: self-hosted setup ends after the organization step.
	if (
		process.env.NEXT_PUBLIC_IS_CAP !== "true" &&
		ordered.every((s) => isComplete(s))
	) {
		redirect("/dashboard");
	}

	const firstIncomplete = ordered.find((s) => !isComplete(s)) ?? "download";

	if (currentStep !== firstIncomplete) {
		redirect(`/onboarding/${firstIncomplete}`);
	}

	return children;
}
