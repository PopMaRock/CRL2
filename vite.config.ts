import { svelte } from "@sveltejs/vite-plugin-svelte";
import tailwindcss from "@tailwindcss/vite";
import path from "path";
import { defineConfig } from "vite";
import Icons from "unplugin-icons/vite";
const host = process.env.TAURI_DEV_HOST;

export default defineConfig({
	plugins: [
		svelte({
			compilerOptions: { runes: true },
			onwarn: (warning, handler) => {
				// disable a11y warnings
				if (warning.code.startsWith("a11y-")) return;
				handler(warning);
			}
		}),
		tailwindcss(),
		Icons({
			compiler: "svelte",
			autoInstall: true // experimental - autoinstalls icons as and when used.
		})
	],
	resolve: {
		alias: {
			$lib: path.resolve("./src/lib")
		}
	},
	server: {
		port: 1420,
		strictPort: true,
		host: host || false,
		hmr: host ? { protocol: "ws", host, port: 1421 } : undefined,
		watch: {
			ignored: ["**/src-tauri/**"]
		}
	},
	envPrefix: ["VITE_", "TAURI_ENV_*"],
	build: {
		// Tauri supports es2021
		target: ["safari15", "chrome100", "firefox100", "edge100"],
		// don't minify for debug builds
		minify: process.env.TAURI_DEBUG ? false : "esbuild",
		// produce sourcemaps for debug builds
		sourcemap: !!process.env.TAURI_DEBUG,
		chunkSizeWarningLimit: 2000
	}
});
