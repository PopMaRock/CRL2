//use to control responses from worker threads
//TODO: Verify implementation.

import { get } from "svelte/store";
import { saveGeneratedImage } from "$lib/controllers/sd";
import { EngineConversation } from "$lib/engine/engine-conversation";
import { DebugLogger } from "$lib/utilities/error-manager";
import { CharacterSettingsStore } from "../engine/engine-character";
import { DungeonGameSettingsStore } from "../engine/engine-dungeon";
import { Gamemode } from "../global";

export async function responseHandler(response: any): Promise<any> {
	try {
		if (!response) throw new Error("No response");
		const respData = response.data;
		const options = JSON.parse(response.options.body);
		const type = response.type;
		const hash = response.hash;
		if (response?.error) throw new Error(response.error);
		if (!type) throw new Error("No type in response");
		if (!hash) throw new Error("No ID in response");
		if (!respData) throw new Error("No result in response");
		//LLM calls that need injected into conversations
		switch (type) {
			case "LLM":
				if (respData) {
					EngineConversation.replace(hash, respData);
				} else {
					EngineConversation.remove(hash);
				}
				return;
			case "image": {
				//console.log("respData", respData);
				//console.log("response", response);
				const id = getGameId();
				if (respData) {
					if (options?.opts?.skipSave) return { type: "image", image: respData };
					if (!id) throw new Error("No gameId in response");
					if (!options.msgPrompt) throw new Error("No msgPrompt in response");
					await saveGeneratedImage(options?.msgPrompt, respData, id, hash);
					return { type: "image", image: respData };
				}
				throw new Error(respData.error); //else throw error
			}
			default:
				throw new Error("The fuck was that? ...Unknown type.");
		}
	} catch (error) {
		let er = error;
		if (response?.type && response?.hash) {
			switch (response.type) {
				case "LLM":
					//need to remove the conversation entry from EngineConversation
					await EngineConversation.remove(response.hash);
					er = `Call to LLM failed ${response?.error ?? er}`;
					break;
				case "image":
					er = `Image failed to generate ${response?.error ?? er}`;
					//remove additionalMedia from conversation
					break;
			}
		}
		DebugLogger.error("Error:", er, { toast: true });
	}
}

function getGameId() {
	const mode = get(Gamemode);
	if (mode === "characters") {
		return get(CharacterSettingsStore).character.id;
	}
	return get(DungeonGameSettingsStore).game.id;
}
