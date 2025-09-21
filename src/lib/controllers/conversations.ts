import { _api } from "$lib/utilities/_api";
import { asyncDebounce } from "$lib/utilities/lodash-wrapper";
import { quietAsyncCatch } from "$lib/utilities/utils";

function getLocation(location: "dungeons" | "characters") {
    return location === "characters" ? "/api/data/character" : "/api/data/dungeon";
}
//== Character Conversations =//
export const dbGetConversations = asyncDebounce(async (params:{gameId?: string, charId?:string, location: "dungeons"|"characters"}): Promise<any[]> => {
    if (!params.charId && !params.gameId) throw new Error("Missing charId or GameId");
    const resp = await quietAsyncCatch(
        async () =>
            await _api(getLocation(params.location), "GET", {
                table: "conversations",
                charId: params?.charId??null,
                gameId: params?.gameId??null,
            }),
        {
            error: "conversations not-found"
        }
    );
    return resp.length > 0 ? resp[0] : resp;
}, 1000);

export const dbPutConversation = asyncDebounce(async (params: { charId: string; conversation: any; location: "dungeons" | "characters"; gameId?: string }): Promise<any> => {
    if (!params.charId) throw new Error("Missing charId (character id)");
    if (!params.conversation || !params.conversation.id) throw new Error("Invalid conversation data");
    return await _api(getLocation(params.location), "POST", {
        table: "conversations",
        charId: params?.charId ?? null,
        gameId: params?.gameId ?? null,
        ...params.conversation
    });
}, 1000);

// id is the gameId or the charId
export const dbUpdateConversation = asyncDebounce(
	async (params: { id: string; conversation: Partial<Conversation>; location: "dungeons" | "characters" }): Promise<any> => {
		if (!params.id) throw new Error("Missing charId (character id)");
		if (!params.conversation || !params.conversation.hash) throw new Error("Invalid conversation data");
		return await _api(getLocation(params.location), "PATCH", {
			table: "conversations",
			charId: params?.id ?? null,
			gameId: params?.id ?? null,
			...params.conversation
		});
	},
	1000
);

export const dbDeleteConversation = asyncDebounce(async (params: { id: string; charId: string; location: "dungeons" | "characters"; gameId?: string }): Promise<any> => {
    if (!params.charId) throw new Error("Missing charId (character id)");
    if (!params.id) throw new Error("Missing conversation id");
    return await _api(getLocation(params.location), "DELETE", {
        table: "conversations",
        charId: params?.charId ?? null,
        gameId: params?.gameId ?? null,
        id: params.id
    });
}, 1000);