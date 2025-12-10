import type { NextConfig } from "next";

const nextConfig = {
	images: {
		remotePatterns: [
			{
				protocol: "https", // Or 'http' if you need to support non-HTTPS images
				hostname: "**", // This wildcard allows all hostnames
				port: "", // Leave empty if not applicable
				pathname: "**", // This wildcard allows all paths
			},
		],
	},
};

export default nextConfig;
