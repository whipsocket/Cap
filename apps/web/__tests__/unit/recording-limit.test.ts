import { describe, expect, it } from "vitest";
import { hasUnlimitedRecording } from "@/lib/recording-limit";

describe("hasUnlimitedRecording", () => {
	it("with a staff organization set: only that organization is unlimited", () => {
		expect(hasUnlimitedRecording("org_staff", "org_staff", false)).toBe(true);
		expect(hasUnlimitedRecording("org_client", "org_staff", true)).toBe(false);
		expect(hasUnlimitedRecording(null, "org_staff", true)).toBe(false);
	});

	it("without one: Cap's own rule (Pro owners unlimited)", () => {
		expect(hasUnlimitedRecording("org_any", null, true)).toBe(true);
		expect(hasUnlimitedRecording("org_any", undefined, false)).toBe(false);
		expect(hasUnlimitedRecording("org_any", "  ", true)).toBe(true);
	});
});
