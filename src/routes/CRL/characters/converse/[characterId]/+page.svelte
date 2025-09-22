<script lang="ts">
	import { onDestroy, onMount } from "svelte";
	import { page } from "$app/state";
	import ChatLayout from "$components/layouts/chat.layout.svelte";
	import { interactiveSd } from "$lib/controllers/sd";
	import { CharacterSettingsStore, CharacterStore } from "$lib/engine/engine-character";
	import { EngineConversation } from "$lib/engine/engine-conversation";
	import { generateCharResponse } from "$lib/engine/engine-llm";
	import { Gamemode, loadState } from "$lib/global";
	import { EngineSd, EngineSdCharacter } from "$lib/stores/sd.store";
	import { DebugLogger } from "$lib/utilities/error-manager";
	import { type FetchRequestInput, RequestManager } from "$lib/utilities/request-manager";
	import { responseHandler } from "$lib/utilities/response-manager";

	export let data: {
		config: any;
		characterId: string;
	};
	let errorMessage = "";
	let RequestMgr = new RequestManager();
	onMount(async () => {
		// Set the stores with the data received from the server
		console.info(`Mounted Character Session ${data.characterId}`);
		DebugLogger.debug("Data", data);
		DebugLogger.debug("Page", page);
		DebugLogger.debug("EngineConversation", $EngineConversation);
		DebugLogger.debug("CharacterSettingsStore", $CharacterSettingsStore);
		DebugLogger.debug("EngineSd", $EngineSd);
		DebugLogger.debug("EngineSdCharacter", $EngineSdCharacter);
	});
	onDestroy(async () => {
		Gamemode.set("engine");
		EngineConversation.set([]);
		await CharacterSettingsStore.reset();
		EngineSd.reset();
		EngineSdCharacter.reset();
		DebugLogger.debug(`Destroyed ${data.characterId} Character session`);
		RequestMgr.killSwitchEngageAll();
	});

	async function sendMessage(message: string, actionOption: string) {
		if ($loadState.llm) return; //calm doon. Already doing something. Sake pal.
		//add the message to the conversation
		DebugLogger.debug("actionOption before generator", actionOption);
		try {
			loadState.update((state) => {
				state.llm = true;
				return state;
			});
			//await generateSummary($CharacterSettingsStore, "characters", $EngineConversation, data.config);
			const settings: FetchRequestInput | undefined = await generateCharResponse(message, actionOption, data.config);
			if (!settings) return;
			DebugLogger.debug("Settings", settings);
			await responseHandler(await RequestMgr.fetchWithCancel(settings));
			DebugLogger.debug("Conversation up to now...", $EngineConversation);
		} catch (error: any) {
			console.error(error);
			DebugLogger.error(error);
			errorMessage = error.message;
		} finally {
			loadState.update((state) => {
				state.llm = false;
				return state;
			});
		}
	}
	async function generateImage(generationMode: number, hash: number) {
		console.log("Generating image...", hash);
		if (Number.isNaN(hash)) return DebugLogger.error("Invalid hash", { toast: true });
		const resp = await interactiveSd(generationMode, $EngineSdCharacter?.modelType ?? "sdxl", hash);
		DebugLogger.debug("Generated image. Data before request...", resp);
		if (!resp || typeof resp !== "object" || !("hash" in resp) || !("url" in resp)) {
			DebugLogger.error("Invalid response from interactiveSd", resp);
			return;
		}
		//then pass to responseHandler...
		//@ts-ignore - shut it typescript.
		await responseHandler(await RequestMgr.fetchWithCancel(resp));
	}
	function abortLlm(e: any) {
		//should be called with id
		RequestMgr.killSwitchEngage(e.detail.hash);
	}
	function handleSendMessage(event: any) {
		//shut the fuck up Typescript.
		const { message, actionOption } = event.detail;
		sendMessage(message, actionOption);
	}
	async function removeConversationEntry(hash: number) {
		await EngineConversation.remove(hash);
	}
	async function removeMedia(hash: number) {
		if (!hash || Number.isNaN(hash)) return DebugLogger.error("Invalid hash", { toast: true });
		await EngineConversation.updateMedia($CharacterStore.charId ?? "", hash, {
			prompt: "",
			url: "",
			type: "",
			transacting: false,
		});
	}
	async function stopMediaTransacting(hash: number, url: string) {
		if (!hash || Number.isNaN(hash)) return DebugLogger.error("Invalid hash", { toast: true });
		if (url) {
			console.log("set transacting to false");
			await EngineConversation.updateMedia($CharacterStore.charId ?? "", hash, { transacting: false });
		} else {
			console.log("set all additional media to nowt.");
			//set additional media to null/false
			await EngineConversation.updateMedia($CharacterStore.charId ?? "", hash, {
				prompt: "",
				url: "",
				type: "",
				transacting: false,
			});
		}
		//call request manager to stop the transacting
		RequestMgr.killSwitchEngage(hash);
	}
</script>

{#if data && $EngineConversation && $CharacterSettingsStore}
	<ChatLayout
		response={RequestMgr.responseStream as any}
		bind:errorMessage
		on:generateImage={async (e) => {
			console.log(e);
			generateImage(e.detail.generationMode ?? 4, e.detail?.hash ?? 0);
		}}
		on:abortLLM={abortLlm}
		on:sendMessage={handleSendMessage}
		on:removeConversationEntry={async (e) => {
			await removeConversationEntry(e.detail.hash);
		}}
		on:removeMedia={async (e) => {
			await removeMedia(e.detail.hash);
		}}
		on:stopMediaTransacting={async (e) => {
			await stopMediaTransacting(e.detail.hash, e.detail.url);
		}}
	/>
{/if}
