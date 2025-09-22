import { tick } from "svelte";
import { CharacterSettingsStore, CharacterStore } from "$lib/engine/engine-character.js";
import { EngineConversation } from "$lib/engine/engine-conversation";
import { Gamemode } from "$lib/global";
import { EngineManager } from "$lib/stores/engine-manager.store";
import { EngineSd, EngineSdCharacter } from "$lib/stores/sd.store";
import { DebugLogger } from "$lib/utilities/error-manager.js";
export const ssr = false; //dinae run on the server. Just molest the browser.

/** @type {import('./$types').PageLoad} */
export async function load({ params, url }) {
	console.error("Character Converse Page");
	const { characterId } = params;
	const baseUrl = url.origin;
	if (!baseUrl) throw new Error("No base URL found");
	if (characterId.includes(".") || !characterId) {
		return;
	}
	//REALLY! SHOULD RESET ALL THE STORES FIRST!
	//reset everything
	await CharacterSettingsStore.reset();
	CharacterStore.reset();
	EngineConversation.set([]);
	EngineManager.reset();
	EngineSd.reset();
	EngineSdCharacter.reset();
	Gamemode.set("characters");
	//set everything
	await tick();
	const tmp = await CharacterStore.get(characterId); //get the character
	await CharacterSettingsStore.get(characterId); //get the character llm settings
	if (!tmp) return DebugLogger.error("Character not found", characterId, {throw: true});
	const convos = await EngineConversation.get(); //get the conversations
	await EngineManager.get(characterId); //get the game manager
	await EngineSd.get(characterId); //get the SD settings
	await EngineSdCharacter.get(characterId); //get the SD character
	if (!convos) {
		//FIXME: this doesn't really work.
		DebugLogger.error("No conversations found", characterId);
		await EngineConversation.add("Hello");
	}
	if (tmp?.character?.sd) await EngineSd.get(characterId); //load SD settings
	return {
		characterId
	};
}
