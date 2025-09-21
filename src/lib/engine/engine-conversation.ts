import { get, writable } from "svelte/store";
import {
	dbDeleteConversation,
	dbGetConversations,
	dbPutConversation,
	dbUpdateConversation
} from "$lib/controllers/conversations";
import { DebugLogger } from "$lib/utilities/error-manager";
import { calculateHash, resultReplace } from "$lib/utilities/utils";
import { Gamemode } from "../global";
import { CharacterSettingsStore, CharacterStore } from "./engine-character";

// Create the store instance
export const EngineConversation = createEngineConversationStore();
// Define the custom store with a save method
function createEngineConversationStore() {
	const { subscribe, set, update } = writable<Conversation[]>([]);

	const self = {
		subscribe,
		set,
		update,
		async add(
			message: string,
			opts?: {
				role?: "assistant" | "user" | "system" | "developer";
				hash?: number;
				type?: string;
				ignoreCleanup?: boolean;
				additionalMedia?: any;
				transacting?: boolean;
				actionOption?: any;
			}
		) {
			if (opts?.actionOption !== "continue") {
				const { id, mode } = getFuckinIdAndMode();
				if (!id) {
					DebugLogger.error("EngineConversation add id is empty");
					return;
				}
				let assistantMessage: Conversation = {
					role: opts?.role ?? "assistant",
					hash: opts?.hash ?? calculateHash(message),
					content: message,
					type: opts?.type ?? "text",
					meta: {} as Meta,
					additionalMedia: opts?.additionalMedia,
					transacting: !!opts?.transacting
				};
				DebugLogger.debug("EngineConversation addition:", assistantMessage);
				if (!opts?.ignoreCleanup) {
					assistantMessage.content = resultReplace(message as string);
				}
				self.update((conversations) => [...(conversations || []), assistantMessage]);
				self.put(assistantMessage); //---save to database---
				//====================//==========================
				// CONTEXT BUILDING
				//====================//==========================
				if (mode === "characters") {
					const charSettings = get(CharacterSettingsStore);
					const character = get(CharacterStore);
					const conversations = get(self);
					//update characters emotional state. =============
					const lastTwoMessages = conversations.length > 0 ? conversations.filter((c) => c.role === "assistant").slice(-2) : null;
					if (lastTwoMessages) {
						//join lastTwoMessages[].content into a single string
						const lastTwoMessagesContent = lastTwoMessages.map((c) => c.content).join(" ");
						const emotion = await CharacterStore.getEmotion(lastTwoMessagesContent);
					}
					//===============================================
				}
				//====================//==========================
			}
		},
		async replace(hash: number, message: string, role = "assistant", type = "text", ignoreCleanup = false, transacting = false) {
			let assistantMessage: Conversation = {
				role,
				hash: hash,
				content: message,
				meta: { timestamp: Date.now(), hasAudio: false },
				type,
				transacting: transacting
			};
			if (!ignoreCleanup) {
				assistantMessage.content = resultReplace(message);
			}
			if (hash) {
				self.update((conversations: any[]) => {
					const index = conversations.findIndex((conversation) => conversation.hash === hash);
					if (index !== -1) {
						conversations[index] = assistantMessage;
					}
					return conversations;
				});
				await self.updateEntry(hash, assistantMessage);
			}
		},
		async updateMedia(id: string, hash: number, media: ConversationAdditionalMedia) {
			if (!id || id.includes(".") || !hash) {
				DebugLogger.error("EngineConversation updateMedia id or hash is empty");
				return;
			}
			const updateData = { additionalMedia: media };
			// Update the conversation with the given hash
			await this.updateEntry(hash, updateData);
		},
		async updateEntry(hash: number, data: Partial<Conversation>) {
			const { id, mode } = getFuckinIdAndMode();
			if (!id || id.includes(".") || !hash) {
				DebugLogger.error("EngineConversation update id or hash is empty");
				return;
			}
			self.update((conversations: any[]) => {
				const index = conversations.findIndex((conversation) => conversation.hash === hash);
				if (index !== -1) {
					conversations[index] = { ...conversations[index], ...data };
				} else {
					DebugLogger.error("EngineConversation update hash not found:", hash);
				}
				return conversations;
			});
			await dbUpdateConversation({
				id,
				conversation: {
					hash,
					...data
				},
				location: mode as "dungeons" | "characters"
			});
		},
		//Put one new conversation into the database
		async put(conversation: Conversation) {
			const { id, mode } = getFuckinIdAndMode();
			if (!id || id.includes(".")) return DebugLogger.error("EngineConversation put id is empty");
			const putData = {
				charId: id,
				conversation: conversation,
				location: mode as "dungeons" | "characters"
			};
			await dbPutConversation(putData);
		},
		async remove(hash: number) {
			const { id, mode } = getFuckinIdAndMode();
			DebugLogger.debug("EngineConversation remove id:", id);
			if (!id || id.includes(".") || !hash) {
				DebugLogger.error("EngineConversation remove id or hash is empty");
				return;
			}
			this.update((conversations: any[]) => {
				const filtered = conversations.filter((conversation) => conversation.hash !== hash);
				return filtered;
			});
			const deleteData = {
				id,
				charId: id,
				location: mode as "dungeons" | "characters",
				hash
			};
			await dbDeleteConversation(deleteData);
		},
		async get() {
			const { id, mode } = getFuckinIdAndMode();
			const result = await dbGetConversations({ gameId: id, charId: id, location: mode as "dungeons" | "characters" });
			if (!result) {
				DebugLogger.debug("EngineConversation get result is empty");
				const msg = {
					role: "assistant",
					content: "Hello!",
					hash: 0,
					meta: { timestamp: Date.now(), hasAudio: false },
					type: "text",
					transacting: false
				};
				// Reset EngineConversation
				self.set([msg]);
				//save it
				await self.put(msg);
			} else {
				// Set EngineConversation to the response
				self.set(result as Conversation[]);
			}
			return result;
		},
		async history(amount: number = 25, skipJoin: boolean = false) {
			//Build the history as LLM will only accept [{role: '', content: ''}] format
			let history: any = structuredClone(get(self));
			if (!history) return [];
			//IMPORTANT: split out all type = image
			history = history.filter((item: any) => item.type !== "image");
			DebugLogger.debug("History after bullshit splice ", history);
			if (history.length > amount) history.splice(0, history.length - amount);
			//-----------------------------------
			//rebuild array so that we only have [{role: '', content: ''}] format
			history = history.map((item: any) => {
				return { role: item.role, content: item.content };
			});
			if (skipJoin) return history;
			return history?.map((item: any) => item.content).join(" ") ?? "";
		},
		async restart(id: string) {
			if (!id || id.includes(".")) return;
			const conversations = get(self);
			if (conversations.length > 2) {
				const firstTwoConversations = conversations.slice(0, 2);
				self.set(firstTwoConversations);
				await self.put(firstTwoConversations[0]);
			}
		}
	};
	return self;
}

function getMode() {
	return get(Gamemode);
}
function getFuckinIdAndMode() {
	const mode = getMode();
	let id = "";
	//@ts-expect-error
	if (mode === "dungeons") id = get(DungeonGameSettingsStore)?.game?.id as string;
	//@ts-expect-error
	else if (mode === "characters") id = get(CharacterSettingsStore)?.character?.id as string;
	return { id, mode };
}
