/**
 * Whipsocket fork: "Pro" labels only make sense on Cap's cloud. Self-hosted, every
 * feature is included (userIsPro is true), so the labels are hidden.
 */
export const showProLabels = () => process.env.NEXT_PUBLIC_IS_CAP === "true";
