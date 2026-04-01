// default open-next.config.ts file created by @opennextjs/cloudflare
import { defineCloudflareConfig } from "@opennextjs/cloudflare";
// import r2IncrementalCache from "@opennextjs/cloudflare/overrides/incremental-cache/r2-incremental-cache";

const cloudflare = defineCloudflareConfig({
	// For best results consider enabling R2 caching
	// See https://opennext.js.org/cloudflare/caching for more details
	// incrementalCache: r2IncrementalCache
});

/** `npm run build` is `opennextjs-cloudflare build`; inner step is `next build` (not `npm run build`) to avoid recursion. */
const openNextConfig = {
	...cloudflare,
	buildCommand: "next build",
};
export default openNextConfig;
