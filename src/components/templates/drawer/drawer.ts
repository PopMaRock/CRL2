import { writable } from "svelte/store";

// Define types for drawer configuration
type DrawerConfig = {
	id: string;
	position?: "left" | "right" | "top" | "bottom";
	width?: string;
	meta?: Record<string, any>;
};

function createDrawerStore() {
	const { subscribe, set, update } = writable<DrawerConfig | null>(null);

	return {
		subscribe,

		/**
		 * Opens a drawer with the specified configuration
		 * @param config The drawer configuration
		 */
		open: {},

		/**
		 * Closes the drawer
		 */
		close: () => {
			set(null);
		}
	};
}

export const drawerStore = createDrawerStore();
export function getDrawerStore() {
	return drawerStore;
}