import { get } from "svelte/store";
import { CharacterSettingsStore } from "$lib/engine/engine-character";
import { EngineConversation } from "$lib/engine/engine-conversation";
import { DungeonGameSettingsStore } from "$lib/engine/engine-dungeon";
import { EngineManager } from "$lib/stores/engine-manager.store";
import { DebugLogger } from "$lib/utilities/error-manager";

export async function restartGame(clearGallery = false) {
	const currentUrl = typeof window !== "undefined" ? window.location.href : "no-window";
	DebugLogger.debug("Current URL:", currentUrl);
	//if the current url contains "dungeons" then we are in dungeons mode
	const isDungeon = currentUrl.includes("dungeon");
	//Get current game settings
	const gameSettings: any = isDungeon ? get(DungeonGameSettingsStore) : get(CharacterSettingsStore);
	const id = isDungeon ? gameSettings?.game?.id : gameSettings?.character?.id;

	if (!gameSettings) return; //no
	if (!id) return; //no
	EngineManager.reset(); //reset EngineManager.
	await EngineManager.save(id as string); //save EngineManager. //FIXME: This won't work for Character mode.
	await EngineConversation.restart(id as string); //reset and save EngineConversation.
	//Clear gallery
	if (clearGallery) {
		//await DungeonGalleryStore.clear(gameSettings.game.id as string);
	}
}
