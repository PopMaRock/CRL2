import dns from "node:dns";
import { sveltekit } from "@sveltejs/kit/vite";
import tailwindcss from "@tailwindcss/vite";
import dotenv from "dotenv";
import Icons from "unplugin-icons/vite";
import topLevelAwait from "vite-plugin-top-level-await";
import wasm from "vite-plugin-wasm";

dns.setDefaultResultOrder("verbatim");
dotenv.config();
/** @type {import('vite').UserConfig} */
export default {
	plugins: [
		sveltekit(
			/*{
			compilerOptions: { runes: true },
			onwarn: (warning, handler) => {
				// disable a11y warnings
				if (warning.code.startsWith("a11y-")) return;
				handler(warning);
			}
		}*/
		),
		wasm(),
		topLevelAwait(),
		tailwindcss(),
		Icons({
			compiler: "svelte",
			autoInstall: true // experimental - autoinstalls icons as and when used.
		})
	],
	optimizeDeps: {
		exclude: ["onnxruntime-web"]
	},
	resolve: process.env.VITEST
		? {
				conditions: ["browser"]
			}
		: undefined
};
