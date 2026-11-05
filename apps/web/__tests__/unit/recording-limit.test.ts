import { describe, expect, it } from "vitest";
import {
	hasUnlimitedRecording,
	unlimitedRecordingOrganizationIds,
} from "@/lib/recording-limit";

describe("recording limit", () => {
	it("lists the staff organization plus the admin's extra organizations", () => {
		expect(
			unlimitedRecordingOrganizationIds({
				PORTAL_STAFF_ORG_ID: "org_staff",
				CAP_UNLIMITED_RECORDING_ORG_IDS: " org_a, ,org_b,org_staff ",
			}),
		).toEqual(["org_staff", "org_a", "org_b"]);
		expect(
			unlimitedRecordingOrganizationIds({ PORTAL_STAFF_ORG_ID: "org_staff" }),
		).toEqual(["org_staff"]);
	});

	it("has no list without portal sign-in (Cap's own rule)", () => {
		expect(
			unlimitedRecordingOrganizationIds({
				CAP_UNLIMITED_RECORDING_ORG_IDS: "org_a",
			}),
		).toBeNull();
	});

	it("with a list: only listed organizations are unlimited", () => {
		const ids = ["org_staff", "org_a"];
		expect(hasUnlimitedRecording("org_staff", ids, false)).toBe(true);
		expect(hasUnlimitedRecording("org_a", ids, false)).toBe(true);
		expect(hasUnlimitedRecording("org_client", ids, true)).toBe(false);
		expect(hasUnlimitedRecording(null, ids, true)).toBe(false);
	});

	it("without a list: Pro owners are unlimited", () => {
		expect(hasUnlimitedRecording("org_any", null, true)).toBe(true);
		expect(hasUnlimitedRecording("org_any", undefined, false)).toBe(false);
	});
});
