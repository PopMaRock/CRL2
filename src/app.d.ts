import "unplugin-icons/types/svelte";
// See https://kit.svelte.dev/docs/types#app
// for information about these interfaces
// and what to do when importing types
declare global {
	const __version__: string;
	namespace App {
		// interface Error {}
		interface Locals {
			user?: any;
			key?: string | null;
		}
		// interface PageData {}
		// interface Platform {}
	}
}
declare module "better-sqlite3";
export {};