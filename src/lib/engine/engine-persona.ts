import { type Writable, writable } from "svelte/store";
import { dbGet, dbSet } from "$lib/controllers/db";
import { DebugLogger } from "$lib/utilities/error-manager";

const EnginePersonaDefault: EnginePersona = {
	persona: "Hamish",
	personaDesc: "{{user}} is a 21 year old male tiger-humanoid that loves to expose himself to bank tellers.",
	personaImage: ""
};
// Create the store instance
export const EnginePersonaStore: Writable<EnginePersona> & {
	get: (fetch?: any) => any;
	setAndPersist: () => Promise<void>;
	reset: () => void;
	uploadBase64Image: (image: string) => Promise<boolean>;
} = createEnginePersonaStore();

// Define the persona store
function createEnginePersonaStore() {
	const { subscribe, set, update } = writable<EnginePersona>(EnginePersonaDefault);

	return {
		subscribe,
		set,
		update,
		get: async () => {
			try {
				const data = await dbGet({ db: "CRL", collection: "personas" });
				if (data) {
					set(data);
				}
				return data;
			} catch (error) {
				console.error("Failed to fetch data:", error);
				return null;
			}
		},
		uploadBase64Image: async (image: string): Promise<boolean> => {
			let currentValue: any;
			subscribe((value) => (currentValue = value))();
			if (!currentValue?.persona) {
				DebugLogger.error("No persona. Add a name first then consider uploading your mugshot", { toast: true });
				return false;
			}
			if (image.length > 100) {
				//it's a base64 image
				//upload the image to the server
				const resp = await fetch("/api/filesystem/images", {
					method: "POST",
					headers: {
						"Content-Type": "application/json"
					},
					body: JSON.stringify({
						image: image,
						filename: `${currentValue.persona}-avatar.png`,
						pathOverride: "/"
					})
				});
				const data = await resp.json();
				console.log("data", data);
				if (data.filePath) {
					//const randomGen = calculateHash(currentValue.persona); // not used but could be useful later
					currentValue.personaImage = `${currentValue.persona}-avatar.png`;
					console.log("persona image path", data);
					set(currentValue);
					return true;
				} else {
					currentValue.personaImage = "";
					set(currentValue);
					return false;
				}
			}
			set(currentValue);
			return false;
		},
		setAndPersist: async () => {
			let currentValue: any;
			subscribe((value) => (currentValue = value))();
			set(currentValue);
			await dbSet({ db: "CRL", collection: "personas", data: currentValue });
		},
		reset: () => {
			set(EnginePersonaDefault);
		}
	};
}
