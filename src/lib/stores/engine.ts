import { clone } from "lodash-es";
import { get, writable } from "svelte/store";
import { llmDefault } from "$lib/constants/defaults/llm-default";
import { dbGet, dbSet } from "$lib/controllers/db";
import { DebugLogger } from "$lib/utilities/error-manager";

//this is LLM settings
const createSettingsStore = () => {
	const { subscribe, set, update } = writable(<EngineSettings>llmDefault);
	return {
		subscribe,
		set,
		update,
		async save() {
			const toSave = get(this);
			DebugLogger.debug("engineSettings.save", toSave);
			await dbSet({ db: "CRL", collection: "EngineSettings", data: toSave });
		},
		async get() {
			const result = await dbGet({ db: "CRL", collection: "EngineSettings" });
			if (!result || result?.error) {
				console.error("Error getting engineSettings from database: ", result?.error);
				return;
			}
			this.set(result);
			return result;
		},
		reset() {
			this.set(clone(llmDefault));
		}
	};
};

export const engineSettings = createSettingsStore();
