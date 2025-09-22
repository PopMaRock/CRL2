import { clone } from "lodash-es";
import { get, writable } from "svelte/store";
import { CharacterLlmDefault, characterDefaults } from "$lib/constants/defaults/character-settings-default";
import { dbGetLLMSettings, dbPutCharacter, dbUpdateCharacter, dbUpdateLLMSettings } from "$lib/controllers/character";
import { dbGet } from "$lib/controllers/db";
import { llmSentiment } from "$lib/controllers/llm";
import { engineSettings } from "$lib/stores/engine";
import { catchError, DebugLogger } from "$lib/utilities/error-manager";
import { saveBase64ToImage } from "$lib/utilities/sd-utils";

function createCharacterSettingsStore() {
	const { subscribe, set, update } = writable<CharacterSettings>(CharacterLlmDefault);

	const self = {
		subscribe,
		set,
		update,
		reset: async () => {
			set(clone(CharacterLlmDefault));
			const mEngine: any = await engineSettings.get();
			DebugLogger.debug("mEngine", mEngine);

			update((s) => {
				const updater = {
					...s,
					llmActive: mEngine.llmActive,
					llmTextSettings: {
						...s.llmTextSettings,
						...mEngine.llmTextSettings,
						historyTruncate: mEngine.llmTextSettings.historyTruncate as "middle" | "start"
					}
				};
				DebugLogger.debug("Setting", updater);
				return updater;
			});
		},
		save: async () => {
			let charId = get(self).charId;
			if (!charId || charId.includes(".")) throw new Error("Character ID is invalid or not set.");
			const charSettings: CharacterSettings = get(self);
			await dbUpdateLLMSettings({
				charId: charId,
				llmsettings: charSettings
			});
		},
		get: async (charId: string) => {
			if (!charId || charId.includes(".")) throw new Error("Character ID is invalid or not set.");
			const result = await dbGetLLMSettings(charId);
			console.log(result);
			if (!result) {
				// Reset CharacterSettingsStore
				self.reset();
			} else {
				// Set CharacterSettingsStore to the response
				self.set(result);
			}
			return result;
		}
	};

	return self;
}
/**
 * Represents a character store with reactive state management and utility methods for character data.
 *
 * @property {Function} subscribe - Subscribes to changes in the character store.
 * @property {Function} set - Sets the character store to a new value.
 * @property {Function} update - Updates the character store with a provided updater function.
 * @property {Function} reset - Resets the character store to its default values.
 * @property {Function} save - Saves the current character to the database after uploading images. Throws an error if the character ID is invalid.
 * @property {Function} saveImages - Uploads images associated with the current character.
 * @property {Function} get - Fetches a character by ID from the database and updates the store. Resets the store if the character is not found.
 * @property {Function} getEmotion - Analyzes the sentiment of the provided text, updates the character's emotional state, saves the character, and returns the detected emotion.
 * @property {Function} getId - Returns the current character's ID, or an empty string if not set.
 */
function createCharacterStore() {
	const { subscribe, set, update } = writable<Character>(clone(characterDefaults));
	const self = {
		subscribe,
		set,
		update,
		reset: () => {
			set(clone(characterDefaults));
		},
		updateEntry: async (data?: any) => {
			let charId = get(self).charId;
			if (!charId || charId.includes(".")) throw new Error("Character ID is invalid or not set.");
			const char: Character = get(self);
			const updatedChar = await uploadImages(char);
			data
				? await dbUpdateCharacter({ charId, character: { ...data } })
				: await dbUpdateCharacter({ charId, character: { ...updatedChar } });
		},
		saveImages: async () => {
			let char = get(self);
			let updatedCharWithImages = await uploadImages(char);
			if (!updatedCharWithImages) {
				throw new Error("Failed to upload images for character.");
			}
			self.set(updatedCharWithImages);
		},
		save: async () => {
			let charId = get(self).charId;
			if (!charId || charId.includes(".")) throw new Error("Character ID is invalid or not set.");
			const char: Character = get(self);
			const updatedChar = await uploadImages(char);
			await dbPutCharacter({ charId, character: updatedChar });
		},
		get: async (charId: string) => {
			const result = await dbGet({
				db: `characters/${charId}/character`
			});
			if (!result) {
				// Reset CharacterStore
				self.reset();
			} else {
				// Set CharacterStore to the response
				self.set(result);
			}
			return result;
		},
		getEmotion: async (text: string) => {
			const char = get(self);
			if (!char || !char.charId) return "";
			const emotion = await llmSentiment(text);
			char.emotionalState = emotion;
			self.update((c) => ({ ...c, emotionalState: emotion }));
			await self.updateEntry();
			return emotion;
		},
		getId: async () => {
			const char = get(self);
			if (!char || !char.charId) return "";
			return char.charId;
		}
	};
	return self;
}
/**
 * Uploads and saves character images if they are in base64 format or not ending with ".png".
 *
 * For each image type (avatar, face, backgroundAvatar, transparentAvatar), this function checks if the image
 * is either a base64 string or does not have a ".png" extension. If so, it saves the image using `saveBase64ToImage`
 * and updates the character's image reference to the new filename.
 *
 * @param char - The character object containing images to be uploaded and saved.
 * @returns The updated character object with image references updated to filenames, or undefined if input is invalid.
 */
async function uploadImages(char: Character) {
	if (!char || typeof char !== "object" || !("id" in char) || !char.id) return;
	// if any image is base64 or not ending with .png then it's changed and needs saved.
	// we have ...character.images.avatar, {...character.images backgroundAvatar, transparentAvatar, face}
	const imageTypes = [
		{ key: "avatar", filename: "avatar.png" },
		{ key: "face", filename: "face.png" },
		{ key: "backgroundAvatar", filename: "backgroundAvatar.png" },
		{ key: "transparentAvatar", filename: "transparentAvatar.png" }
	];

	for (const { key, filename } of imageTypes) {
		const image = char.images[key as keyof typeof char.images];
		if (image && (image.startsWith("data:image") || !image.endsWith(".png"))) {
			const savedImage = await catchError(saveBase64ToImage(image, char.charId, filename));
			if (savedImage) {
				char.images[key as keyof typeof char.images] = filename;
			}
		}
	}
	return char;
}
export const CharacterStore = createCharacterStore();
export const CharacterSettingsStore = createCharacterSettingsStore();
