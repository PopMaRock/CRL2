import { get, writable } from "svelte/store";
import { dbGet, dbSet } from "$lib/controllers/db";
import { Gamemode } from "$lib/global";
import { DebugLogger } from "$lib/utilities/error-manager";

export const EngineManager = createEngineManager();

function createEngineManager() {
	const { subscribe, set, update } = writable<EngineManagerType>();

	return {
		subscribe,
		set,
		update,
		async get(id: string) {
			if (!id || id.includes(".")) return;
			const mode = get(Gamemode);

			const result = await dbGet({
				db: `${mode}/${id}/EngineManager`
			});
			DebugLogger.debug("EngineManager get result:", result);
			if (!result) {
				// Reset EngineManager
				DebugLogger.debug("Resetting EngineManager");
				this.reset();
			} else {
				DebugLogger.debug("Setting EngineManager to response");
				// Set EngineManager to the response
				this.set(result);
			}
		},
		async save(id: string) {
			if (!id || id.includes(".")) return;
			const mode = get(Gamemode);
			const dm = get(this);
			if (!dm) {
				//This shouldn't happen........
				DebugLogger.error("EngineManager is undefined");
				return;
			}
			await dbSet({
				db: `${mode}/${id}/EngineManager`,
				data: dm
			});
		},
		generateLlm: (Dgss: DungeonGameSettings) => {
			// Implementation for generateLlm
			DebugLogger.debug("generateLlm called");
		},
		generateSd: (Dgss: DungeonGameSettings) => {
			// Implementation for generateSd
			DebugLogger.debug("generateSd called");
		},
		generateVo: (Dgss: DungeonGameSettings) => {
			// Implementation for generateVo
			DebugLogger.debug("generateVo called");
		},
		reset: () => {
			// Implementation for reset
			update(() => ({
				state: {},
				summaries: [],
				player: {},
				characters: [],
				currentCharacter: {},
				currentLocation: {}
			}));
			DebugLogger.debug("reset called");
		}
	};
}
