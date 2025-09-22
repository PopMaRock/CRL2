import { get } from "svelte/store";
import { browser } from "$app/environment";
//import ModalRawImage from "$components/Base/Modals/modal-interactive-sd.svelte";
import { CharacterStore } from "$lib/engine/engine-character";
import { EngineConversation } from "$lib/engine/engine-conversation";
import { DungeonGameSettingsStore } from "$lib/engine/engine-dungeon";
import { generateImagePrompt } from "$lib/engine/engine-llm";
import { Gamemode, loadState } from "$lib/global";
import {
	comfyReplaceTags,
	EngineSd,
	EngineSdCharacter,
	generationMode,
	promptTemplatesFlux,
	promptTemplatesSd
} from "$lib/stores/sd.store";
import { toastr } from "$lib/ui/toastr";
import { catchError, DebugLogger } from "$lib/utilities/error-manager";
import { readablestreamStore } from "$lib/utilities/readable-stream";
import type { FetchRequestInput } from "$lib/utilities/request-manager";
import { getWorkflow, saveBase64ToImage, toBase64 } from "$lib/utilities/sd-utils";
import { calculateHash, resultReplace } from "$lib/utilities/utils";

//Wan prompt generator: https://dengeai.com/prompt-generator
function getSdStores() {
	const dSd = get(EngineSd);
	const dSDc = get(EngineSdCharacter);
	const mode = get(Gamemode);
	//@ts-expect-error
	const url = dSd?.[dSd?.source]?.url;
	if (!url || !dSd.source) {
		DebugLogger.error("No URL or source found.");
	}
	if (mode === "characters") {
		const game = get(CharacterStore);
		return { dSD: dSd, dSDc, game, url, mode };
	}
	const game = get(DungeonGameSettingsStore).game;
	return { dSD: dSd, dSDc, game, url, mode };
}
//TODO: IMPLEMENT INTERRUPT
export async function interruptSd() {
	const { dSD, url } = getSdStores();
	const result: any = await callSdApi(dSD.source, getSdRequestBody(url, "interrupt"));
	if (!result || !result.success) return DebugLogger.error(`SD ${dSD.source} returned an error.`);
	return result.data;
}
export async function LLMPromptGen() {
	//TODO: IMPLEMENT STORY TO PROMPT
}
export async function getSdControlNetModules() {
	const { dSD, url } = getSdStores();
	const result: any = await callSdApi(dSD.source, getSdRequestBody(url, "get-ct-modules"));
	if (!result || !result.success) return DebugLogger.error(`SD ${dSD.source} returned an error.`);
	return result.data.module_list;
}
export async function getSdControlNetModels() {
	const { dSD, url } = getSdStores();
	const result: any = await callSdApi(dSD.source, getSdRequestBody(url, "get-ct-models"));
	if (!result || !result.success) return DebugLogger.error(`SD ${dSD.source} returned an error.`);
	return result.data.model_list;
}
export async function getSdControlNetTypes() {
	const { dSD, url } = getSdStores();
	const result: any = await callSdApi(dSD.source, getSdRequestBody(url, "get-ct-types"));
	if (!result || !result.success) return DebugLogger.error(`SD ${dSD.source} returned an error.`);
	return result.data;
}
export async function getSdScripts() {
	const { dSD, url } = getSdStores();
	const result: any = await callSdApi(dSD.source, getSdRequestBody(url, "scripts"));
	if (!result || !result.success) return DebugLogger.error(`SD ${dSD.source} returned an error when trying to get scripts.`);
	return result.data;
}
export async function getSdLoras(ipadapterOnly = true) {
	const { dSD, url } = getSdStores();
	const result: any = await callSdApi(dSD.source, getSdRequestBody(url, "get-loras"));
	if (!result || !result.success) return DebugLogger.error(`SD ${dSD.source} returned an error when trying to get LORAs.`);
	const data = await result.data;
	DebugLogger.debug("LORAS", data);
	if (ipadapterOnly) {
		return data.filter((item: { name: string | string[] }) => item.name.includes("ip-adapter"));
	}
	return data.module_list;
}
export async function getSdVaes() {
	const { dSD, url } = getSdStores();
	const result: any = await callSdApi(dSD.source, getSdRequestBody(url, "get-vaes"));
	if (!result || result.success) return DebugLogger.error(`SD ${dSD.source} returned an error when getting VAEs.`);
	const data = result.data;
	Array.isArray(data) && data.unshift("Automatic");
	return data ?? [];
}
export async function getSdModels() {
	const { dSD, url } = getSdStores();
	if (!dSD.source || !url) return DebugLogger.error("No source or URL found.");
	const currentModel = await getSdModel();
	if (currentModel) {
		//extension_settings.sd.model = currentModel;
	}
	const result: any = await callSdApi(dSD.source, getSdRequestBody(url, "get-models"));
	DebugLogger.debug("SD Models", result);
	if (!result) throw new Error(`No result returned from SD ${dSD.source}.`);
	if (!result || !result.success) return DebugLogger.error(`SD ${dSD.source} returned an error when trying to get models.`);
	return result.data;
}
export async function getSdSamplers() {
	const { dSD, url } = getSdStores();
	const result: any = await callSdApi(dSD.source, getSdRequestBody(url, "get-samplers"));
	if (!result || !result?.success) DebugLogger.error(`SD ${dSD.source} returned an error when trying to get samplers.`);
	return result?.data ?? [];
}
export async function getSdSchedulers() {
	const { dSD, url } = getSdStores();
	const result: any = await callSdApi(dSD.source, getSdRequestBody(url, "get-schedulers"));
	if (!result || !result?.success || !result?.data) {
		return DebugLogger.error(`SD ${dSD.source} returned an error when trying to get schedulers.`);
	}
	return result.data ?? [];
}
export async function getSdUpscalers() {
	const { dSD, url } = getSdStores();
	if (dSD.source === "comfy") return [];
	const result: any = await callSdApi(dSD.source, getSdRequestBody(url, "get-upscalers"));
	if (!result || !result?.success) DebugLogger.error(`${dSD.source} API returned an error when getting Upscalers.`);
	return result?.data ?? [];
}
export async function updateSdModel() {
	const { dSD, dSDc, url } = getSdStores();
	const result: any = await callSdApi(
		dSD.source,
		getSdRequestBody(url, "set-model", {
			model: dSDc.model
		})
	);
	if (!result || !result.success) return DebugLogger.error(`No result returned from SD ${dSD.source}.`, { toast: true });
	return DebugLogger.debug(`Model successfully updated on SD ${dSD.source} remote.`);
}
export async function validateSdUrl() {
	const { dSD, url } = getSdStores();
	const result: any = await callSdApi(dSD.source, getSdRequestBody(url, "ping"));
	if (!result || !result?.success) return DebugLogger.error(`SD ${dSD.source} API returned an error.`, { toast: true });
	toastr({ message: `SD ${dSD.source} API connected.`, type: "success" });
	return true;
}
export async function getSdModel() {
	const { dSD, url } = getSdStores();
	return await callSdApi(dSD.source, getSdRequestBody(url, "get-model"));
}
export async function getSdWorkflows() {
	const path = "/static/comfyui-workflows/image/";
	const response: Response | boolean = await catchError(
		fetch(`/api/filesystem?path=${path}&type=json`, { credentials: "include" })
	);
	if (!(response instanceof Response)) return [];
	const result = await response.json();
	return result;
}
export async function generateComfyImage(
	msgPrompt: string,
	hash: number,
	opts?: { generationMode: number; skipSave: boolean; skipAddToConversation: boolean; skipFaceImage: boolean }
) {
	const { dSD, dSDc, game }: any = getSdStores();
	if (!dSD || !dSDc || !game.id) return DebugLogger.error("FATAL ERROR: No SD or game found.", { toast: true });
	let imageBase64 = "";
	//check workflow file exists
	const workflow = dSDc.comfy.imageWf;
	if (!workflow) return DebugLogger.warn("No workflow selected.", { toast: true });
	const workflowJson = await catchError(getWorkflow(workflow));
	if (!opts?.skipFaceImage) imageBase64 = await getFaceImage(game);

	if (!imageBase64 && !workflowJson) return DebugLogger.error("No image or workflow found.", { toast: true });
	const workflowReplaced = comfyReplaceTags(workflowJson, dSD, dSDc, game, msgPrompt, imageBase64, opts);
	const mHash = hash > 0 ? hash : calculateHash(msgPrompt);
	if (!opts?.skipAddToConversation && (!hash || hash === 0)) {
		await EngineConversation.add("", {
			additionalMedia: { caption: `prompt:${msgPrompt}`, type: "image", transacting: true },
			hash: mHash,
			role: "assistant",
			ignoreCleanup: true
		});
	}

	const requestPish = getSdRequestBody(dSD.comfy.url, "generate", { body: { prompt: workflowReplaced } });
	const options: RequestInit = {
		body: JSON.stringify({
			msgPrompt: msgPrompt,
			action: requestPish.action,
			url: requestPish.url,
			auth: requestPish.auth,
			body: requestPish.body,
			opts: requestPish.opts
		}),
		headers: { "Content-Type": "application/json" },
		method: "POST"
	};
	//send the workflow to the SD API
	const result: FetchRequestInput = {
		type: "image",
		hash: mHash,
		url: "/api/sd/comfy/generate",
		options,
		opts: { stream: true, streamType: "websocket" }
	};
	console.log("Result", result);
	return result;
	//if (!result?.data) return DebugLogger.error("No result returned from SD ComfyUI.", { toast: true });
	//*****************************
	// SAVE IMAGE
	// **************************** */
	//generate a random prompt id
	/*const promptId = Math.random().toString(36).substring(2, 15);
	const imageData = result.data;
	//**************************************
	if (typeof imageData !== 'string') return '';
	if (!opts?.skipSave) return await saveGeneratedImage(promptId, msgPrompt, imageData, game.id, hash);
	return result;*/
}
export async function saveGeneratedImage(msgPrompt: string, imageData: string, id: string, hash: number) {
	//DebugLogger.debug("Response received", imageData);
	const fileName = `${hash}${Date.now()}.png`;
	const savedImage = await catchError(saveBase64ToImage(imageData, id, fileName));
	if (!savedImage) DebugLogger.error("Error saving image.");
	await addImageToConversation(id, hash, msgPrompt, fileName);
	return { success: true };
}
async function addImageToConversation(id: string, hash: number, msgPrompt: string, fileName = "") {
	const file = fileName ?? `${hash}.png`;
	if (hash)
		//push into conversation
		await EngineConversation.updateMedia(id, hash, {
			url: file,
			prompt: msgPrompt,
			caption: "Generated Image",
			type: "image",
			transacting: false
		});
	else
		await EngineConversation.add(`[image:${file}][prompt:${msgPrompt}]`, {
			role: "assistant",
			type: "image",
			ignoreCleanup: true
		});
}
async function getFaceImage(game: any) {
	let imageBase64 = "";
	if (game?.images?.face) {
		imageBase64 = await toBase64(`/api/filesystem/images?id=${game.id}&mode=characters&filename=${game?.images?.face}`, true);
	}
	if (!imageBase64) return "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkAAIAAAoAAv/lPAAAAA==";
	return imageBase64;
}
function getSdRequestBody(url: string, action = "ping", opts?: any) {
	return {
		url: url,
		auth: null,
		action: action,
		...opts
	};
}
async function callSdApi(source: string, body: any, url?: string, opts?: { stream?: boolean; contentType?: string }) {
	if (!body) {
		DebugLogger.error("No body provided.");
		return null;
	}
	console.log("Calling SD API", body);
	if (browser) {
		if (!source) DebugLogger.error("No source provided.");
		const getUrl = url ? url : "/api/sd/comfy/options";
		const result = await fetch(getUrl, {
			method: "POST",
			headers: { "Content-Type": opts?.contentType ?? "application/json" },
			body: JSON.stringify(body),
			credentials: "include"
		});

		if (opts?.stream) {
			if (!result.body) {
				DebugLogger.error("No readable stream available");
				return { success: false };
			}
			const reader = result.body.getReader();
			const decoder = new TextDecoder();
			let done = false;
			let allData = "";

			while (!done) {
				const { value, done: finished } = await reader.read();
				done = finished;
				if (value) {
					const chunk = decoder.decode(value, { stream: true });
					//DebugLogger.debug("Stream chunk:", chunk);
					allData += chunk;
				}
			}
			return { success: true, data: allData };
		}
		const data = opts?.contentType?.includes("image") ? await result.text() : await result.json();
		if (result.status !== 200) {
			return DebugLogger.error(`Error making SD call to ${source} API.`, result.status);
		}
		if (!data || data?.error) DebugLogger.error(data?.error);
		return { success: true, data };
	}
}
/** INTERFACE */
export async function interactiveSd(
	action: number,
	modelType: string,
	hash?: number
): Promise<FetchRequestInput | unknown> {
	DebugLogger.debug("Interactive SD", action);
	if (!browser) return;
	const Dcs = get(EngineConversation);
	let opts: any = {};
	const { dSD, game } = getSdStores();
	if (!game.hash) return DebugLogger.error("No character/game ID found.");

	// Helper to handle LLM-related prompt generation workflow.
	async function handleLlmPrompt(getPrompt: () => Promise<any>, title: string, desc: string) {
		let promptText: any;
		loadState.update((s: any) => ({ ...s, llm: true }));
		try {
			promptText = await getPrompt();
			if (!promptText) throw new Error("No prompt returned.");
			promptText = resultReplace(promptText);
		} catch (error) {
			DebugLogger.error(error);
			return null;
		} finally {
			loadState.update((s: any) => ({ ...s, llm: false }));
		}
		return promptEdit(Ms, promptText, title, desc);
	}

	let prom: any;
	switch (action) {
		case 0:
			// TODO: Implement character action if needed.
			break;

		case 2:
			// TODO: Implement whole story action using raw generation.
			break;

		case 3: {
			// Use the last conversation prompt or the one associated with the provided hash.
			let selectedMsg = "";
			const title = hash ? "Regen the image" : "Rawdog the image";
			const desc = hash
				? "Edit the prompt to generate a new image."
				: "This may generate utter nonsense but off you go, you do you.";
			if (hash) {
				const item = Dcs.find((msg: any) => msg.hash === hash);
				selectedMsg = item?.additionalMedia?.prompt ?? "";
			} else {
				selectedMsg = Dcs[Dcs.length - 1].content;
			}
			prom = await promptEdit(selectedMsg.replace(/\n/g, ""), title, desc);
			break;
		}

		case generationMode.NOW:
		case generationMode.BACKGROUND: {
			// Generate prompt based on the last message or generate a background (7)
			if (action === generationMode.BACKGROUND) opts = { skipFaceImage: false, skipSave: true, skipAddToConversation: true };
			const resp = readablestreamStore();
			const template = modelType === "flux" ? promptTemplatesFlux[action] : promptTemplatesSd[action];
			if (action === generationMode.NOW) {
				//get last message hash
				const index = Dcs.length - 1;
				const lastMsg = Dcs[index];
				hash = lastMsg.hash ?? null;
			}
			prom = await handleLlmPrompt(
				//() => generateImagePrompt(resp, template, 5),
				() => generateImagePrompt(template, 5),
				"Edit prompt",
				"Edit the prompt before sending to image generator",
			);
			break;
		}

		case 99: {
			// Generate prompt using conversation cut.
			DebugLogger.debug("Generating prompt using conversation cut.");
			const resp = readablestreamStore();
			if (!hash) return DebugLogger.error("No hash found.", { toast: true });
			const index = Dcs.findIndex((msg: any) => msg.hash === hash);
			if (index === -1) return DebugLogger.error("No message found.", { toast: true });
			const conversation = Dcs.slice(0, index + 1);
			const template = modelType === "flux" ? promptTemplatesFlux[4] : promptTemplatesSd[4];
			const cut = conversation.length >= 5 ? conversation.slice(-5) : conversation;
			const cutMsg = cut.map((msg: any) => ({ role: msg.role, content: msg.content }));
			prom = await handleLlmPrompt(
				//() => generateImagePrompt(resp, template, 5, cutMsg),
				() => generateImagePrompt(template, 5),
				"Edit prompt",
				"Edit the prompt before sending to image generator"
			);
			break;
		}

		default:
			return DebugLogger.error("No action found.", { toast: true });
	}

	if (!prom || !prom?.prompt) return DebugLogger.error("No prompt found.", { toast: true });
	//DebugLogger.warn("Prompt returned", prom.prompt);
	try {
		if (hash && hash > 0) {
			await EngineConversation.updateMedia(game.hash, hash, {
				prompt: prom.prompt,
				type: "image",
				transacting: true
			});
		}
		//add generationMode to opts to pass to comfyImage
		opts = { ...opts, generationMode: action };
		loadState.update((s: any) => ({ ...s, image: true }));
		return await generateComfyImage(prom.prompt, hash ?? 0, opts);
		//if (dSD.source === "webui") return await generateAutoImage(prom.prompt, 0, hash ?? 0, null);
	} catch (error) {
		// On error, remove the additional media from the conversation.
		if (hash) {
			console.log("Error updating media", error);
			await EngineConversation.updateMedia(game.hash, hash, {
				prompt: "",
				type: "",
				transacting: false
			});
			DebugLogger.error("Error generating image.", { error });
		}
	} finally {
		loadState.update((s: any) => ({ ...s, image: false }));
	}
}
async function promptEdit(
	modalStore: any,
	prompt: string,
	title = "Edit the prompt",
	desc = "Edit the prompt to generate a new image."
): Promise<any> {
	if (!browser) return Promise.resolve(null);
	modalStore.clear();
	return new Promise<object>((resolve) => {
		let resolved = false;
		const safeResolve = (res: any) => {
			if (resolved) return;
			resolved = true;
			resolve(res);
		};
		/*const modalSettings: ModalSettings = {
			type: "component",
			component: { ref: ModalRawImage } as ModalComponent,
			title,
			body: desc,
			meta: { prompt },
			response: safeResolve
		};
		modalStore.trigger(modalSettings);*/
	});
}
