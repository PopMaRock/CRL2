import { get } from "svelte/store";
import { browser } from "$app/environment";
import { EnginePersonaStore } from "$lib/engine/engine-persona";
import { engineSettings } from "$lib/stores/engine";
import { EngineSd } from "$lib/stores/sd.store";
import { DebugLogger } from "$lib/utilities/error-manager";
import type { LayoutLoad } from "./$types";

export const load = (async ({ fetch }) => {
	if (browser) {
		let engineLlm = get(engineSettings);
		let ESd: any = get(EngineSd);
		DebugLogger.debug("Initial engineLlm from store:", engineLlm);

		if (!engineLlm || Object.keys(engineLlm).length === 0) {
			DebugLogger.debug("Fetching engineLlm settings from database...");
			engineLlm = await engineSettings.get(); // get the llm settings
			DebugLogger.debug("Fetched engineLlm from database:", engineLlm);
		}
		// Still nothing then set default
		if (!engineLlm || !Object.hasOwn(engineLlm, "llmActive")) {
			DebugLogger.debug("No LLM settings found, setting default");
			engineSettings.reset();
			engineLlm = get(engineSettings);
			DebugLogger.debug("Default engineLlm set:", engineLlm);
		}
		//If no EngineSd then get defaults from CRL database.
		if (!ESd || Object.keys(ESd).length === 0) {
			DebugLogger.debug("Fetching EngineSd settings from database...");
			ESd = await EngineSd.getDefault();
			DebugLogger.debug("Fetched EngineSd from database:", ESd);
		}
		// Still nothing then set default
		if (!ESd || !Object.hasOwn(ESd, "sdActive")) {
			DebugLogger.debug("No SD settings found, setting default");
			EngineSd.reset();
			ESd = get(EngineSd);
			DebugLogger.debug("Default EngineSd set:", ESd);
		}

		let persona = await EnginePersonaStore.get(fetch);
		DebugLogger.debug("Fetched persona from database:", persona);

		if (!persona || Object.keys(persona).length === 0) {
			DebugLogger.debug("No persona found, setting default");
			EnginePersonaStore.reset(); // Reset to default
			persona = get(EnginePersonaStore);
			DebugLogger.debug("Default persona set:", persona);
		}
	}

	return {};
}) satisfies LayoutLoad;
