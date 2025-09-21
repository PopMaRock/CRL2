import { get, writable } from "svelte/store";
import { DungeonGameSettingsDefault } from "$lib/constants/defaults/dungeon-settings-defaults";
import { dbGet, dbSet } from "$lib/controllers/db";
import { engineSettings } from "$lib/stores/engine";
import { DebugLogger } from "$lib/utilities/error-manager";

function createDungeonGameSettingsStore() {
	const { subscribe, set, update } = writable<DungeonGameSettings>(DungeonGameSettingsDefault);
	return {
		subscribe,
		set,
		update,
		reset: async () => {
			set(structuredClone(DungeonGameSettingsDefault));
			const mEngine: any = await engineSettings.get();
			DebugLogger.debug("mEngine", mEngine);

			update((s) => {
				const updater = {
					...s,
					llmActive: mEngine.llmActive,
					llmTextSettings: {
						...s.llmTextSettings,
						...mEngine.llmTextSettings,
						historyTruncate: mEngine.llmTextSettings.historyTruncate as "middle" | "start"
					},
					llmResponseSettings: {
						...s.llmResponseSettings,
						...mEngine.llmResponseSettings
					}
				};
				DebugLogger.debug("Setting", updater);
				return updater;
			});
		},
		save: async () => {
			const tempDungeon = get(DungeonGameSettingsStore);
			await dbSet({
				db: `dungeons/${tempDungeon.game.id}/gamesettings`,
				data: tempDungeon
			});
		},
		async get(gameId: string) {
			if (!gameId || gameId.includes(".")) return;
			const result = await dbGet({
				db: `dungeons/${gameId}/gamesettings`
			});
			if (!result) {
				// Reset DungeonGameSettingsStore
				this.reset();
			} else {
				// Set DungeonGameSettingsStore to the response
				this.set(result);
			}
			return result;
		}
	};
}
export const DungeonGameSettingsStore = createDungeonGameSettingsStore();
