import { _api } from "$lib/utilities/_api";
import { asyncDebounce } from "$lib/utilities/lodash-wrapper";
import { quietAsyncCatch } from "$lib/utilities/utils";

//== llmsettings Settings =//
export const dbGetLLMSettings = asyncDebounce(async (charId?: string): Promise<CharacterSettings | null> => {
	if (!charId) throw new Error("Missing charId (character id)");
	const resp = await quietAsyncCatch(
		async () =>
			await _api("/api/data/character", "GET", {
				table: "llmsettings",
				charId: charId
			}),
		{
			error: "user-not-found"
		}
	);
	return resp.length > 0 ? resp[0] : null;
}, 1000);

export const dbPutLLMSettings = asyncDebounce(async (params: { charId: string; llmsettings: any }): Promise<any> => {
	if (!params.charId) throw new Error("Missing charId (character id)");
	if (!params.llmsettings) throw new Error("Invalid llmsettings data");
	return await _api("/api/data/character", "POST", {
		table: "llmsettings",
		charId: params.charId,
		data: { charId: params.charId, ...params.llmsettings }
	});
}, 1000);

export const dbUpdateLLMSettings = asyncDebounce(async (params: { charId: string; llmsettings: any }): Promise<any> => {
	if (!params.charId) throw new Error("Missing charId (character id)");
	if (!params.llmsettings) throw new Error("Invalid llmsettings data");
	return await _api("/api/data/character", "PATCH", {
		table: "llmsettings",
		data: params.llmsettings,
		where: "charId",
		value: params.charId
	});
}, 1000);

export const dbDeleteLLMSettings = asyncDebounce(async (params: { hash: string; charId: string }): Promise<any> => {
	if (!params.charId) throw new Error("Missing charId (character id)");
	if (!params.hash) throw new Error("Missing llmsettings id");
	return await _api("/api/data/character", "DELETE", {
		table: "llmsettings",
		charId: params.charId,
		hash: params.hash
	});
}, 1000);

//== Character =//
export const dbGetCharacter = asyncDebounce(async (charId?: string): Promise<any[]> => {
	if (!charId) throw new Error("Missing charId (character id)");
	const resp = await quietAsyncCatch(
		async () =>
			await _api("/api/data/character", "GET", {
				table: "character",
				charId: charId
			}),
		{
			error: "user-not-found"
		}
	);
	return resp.length > 0 ? resp[0] : resp;
}, 1000);

export const dbPutCharacter = asyncDebounce(async (params: { charId: string; character: any }): Promise<any> => {
	if (!params.charId) throw new Error("Missing charId (character id)");
	if (!params.character || !params.character.id) throw new Error("Invalid character data");
	return await _api("/api/data/character", "POST", {
		table: "character",
		charId: params.charId,
		...params.character
	});
}, 1000);

export const dbUpdateCharacter = asyncDebounce(async (params: { charId: string; character: any }): Promise<any> => {
	if (!params.charId) throw new Error("Missing charId (character id)");
	if (!params.character || !params.character.id) throw new Error("Invalid character data");
	return await _api("/api/data/character", "PATCH", {
		table: "character",
		where: "charId",
		value: params.charId,
		data: params.character
	});
}, 1000);

export const dbDeleteCharacter = asyncDebounce(async (params: { hash: string; charId: string }): Promise<any> => {
	if (!params.charId) throw new Error("Missing charId (character id)");
	if (!params.hash) throw new Error("Missing character id");
	return await _api("/api/data/character", "DELETE", {
		table: "character",
		charId: params.charId,
		hash: params.hash
	});
}, 1000);

export const dbGetStartUp = asyncDebounce(async (charId?: string): Promise<any[]> => {
	if (!charId) throw new Error("Missing charId (character id)");
	const resp = await quietAsyncCatch(
		async () =>
			await _api("/api/data/character", "HEAD", {
				charId: charId
			}),
		{
			error: "startup-failed"
		}
	);
	return resp.length > 0 ? resp[0] : resp;
}, 1000);
