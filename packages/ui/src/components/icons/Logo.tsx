import { GlassMark, GlassWordmark, useGlassLogoIds } from "./glass-logo";

export const Logo = ({
	className,
	showVersion,
	showBeta,
	white,
	hideLogoName,
	viewBoxDimensions = "0 0 120 40",
	style,
}: {
	className?: string;
	showVersion?: boolean;
	showBeta?: boolean;
	white?: boolean;
	hideLogoName?: boolean;
	style?: React.CSSProperties;
	viewBoxDimensions?: `${string} ${string} ${string} ${string}`;
}) => {
	const ids = useGlassLogoIds();

	// Whipsocket fork: our instance shows its own logo (built with
	// NEXT_PUBLIC_INSTANCE_LOGO=1; files in apps/web/public/instance).
	if (process.env.NEXT_PUBLIC_INSTANCE_LOGO === "1") {
		const src = hideLogoName
			? "/instance/logo-icon.png"
			: white
				? "/instance/logo-light.svg"
				: "/instance/logo-dark.svg";
		return (
			<div className="flex items-center">
				{/* biome-ignore lint/performance/noImgElement: static brand asset */}
				<img
					src={src}
					alt="Whipsocket"
					className={`object-contain object-left ${className ?? ""}`}
					style={style}
				/>
			</div>
		);
	}

	return (
		<div className="flex items-center">
			<svg
				viewBox={viewBoxDimensions}
				xmlns="http://www.w3.org/2000/svg"
				preserveAspectRatio="xMidYMid meet"
				fill="none"
				style={style}
				role="img"
				aria-label="Cap Logo"
				className={className}
			>
				<GlassMark ids={ids} />
				{!hideLogoName && <GlassWordmark ids={ids} white={white} />}
			</svg>
			{showVersion && (
				<span
					className={`text-[10px] font-medium ${
						white ? "text-white" : "text-gray-1"
					}`}
				>
					v{process.env.appVersion}
				</span>
			)}
			{showBeta && (
				<span
					className={`text-[10px] font-medium min-w-[52px] ${
						white ? "text-white" : "text-gray-1"
					}`}
				>
					Beta v{process.env.appVersion}
				</span>
			)}
		</div>
	);
};
