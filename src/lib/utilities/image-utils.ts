//for client side only

import { get } from "svelte/store";
import { browser } from "$app/environment";
import { CharacterStore } from "$lib/engine/engine-character";
import { removeBackgroundFromImage } from "$lib/transformers/csr/transformers";
import { toastrPromise } from "$lib/ui/toastr";
import { DebugLogger } from "./error-manager";

// removeBG
export async function removeBg(file: string, imageType: string) {
	if (browser) {
		const char = get(CharacterStore);
		//remove the old one and update CharacterStore.images.transparentAvatar with ""
		CharacterStore.update((c) => {
			if (imageType === "avatar") {
				c.images.transparentAvatar = "";
			} else {
				c.images.backgroundAvatar = "";
			}
			return c;
		});
		if (!file) {
			DebugLogger.warn("No avatar file found", { toast: true });
			return;
		}
		if (!imageType) {
			DebugLogger.warn("No image type passed", { toast: true });
			return;
		}
		file = await ensureCharacterImageBase64(file, char.charId);
		await toastrPromise({
			messages: {
				loading: "Trying to remove background",
				success: (data: any) => {
					const imageBase64 = data.startsWith("data:") ? data : `data:image/png;base64,${data}`;
					if (imageType === "avatar") {
						char.images.transparentAvatar = imageBase64;
					} else {
						char.images.backgroundAvatar = imageBase64;
					}
					if (imageBase64.length > 50) {
						//validate if imageBase64 is a an imageBase64 string and DebugLogger.debug it
						DebugLogger.debug("Most likely an image base64");
					}
					CharacterStore.update((c) => {
						if (imageType === "avatar") {
							c.images.transparentAvatar = imageBase64;
						} else {
							c.images.backgroundAvatar = imageBase64;
						}
						return c;
					});
					return "Background removed";
				},
				error: "Failed to remove background"
			},
			promiscuous: removeBackgroundFromImage(file)
		});
	}
}
export async function ensureCharacterImageBase64(file: string, charId?: string | null): Promise<string> {
	if (!file) {
		DebugLogger.warn("No avatar file found", { toast: true });
		return "";
	}
	if (file.startsWith("data:")) {
		return file;
	}
	// if there's no charId, we can't help you from here pal.
	if (!charId) throw new Error("Character ID is required to get image from filesystem");
	if (charId) {
		const resp = await fetch(`/api/filesystem/images?id=${charId}&mode=characters&filename=${file}`, { credentials: "include" });
		if (!resp.ok) {
			DebugLogger.error("Failed to get image", { toast: true });
			return "";
		}
		const blob = await resp.blob();
		const reader = new FileReader();
		return new Promise((resolve, reject) => {
			reader.onloadend = () => resolve(reader.result as string);
			reader.onerror = reject;
			reader.readAsDataURL(blob);
		});
	}
	return "";
}
export async function getHeadshot(file: string, facePadding = 70) {
	if (browser) {
		const char = get(CharacterStore);
		if (!file) {
			DebugLogger.warn("No avatar file found", { toast: true });
			return;
		}
		const resp: any = await fetch("/api/transformers/facedetection", {
			credentials: "include",
			method: "POST",
			headers: {
				"Content-Type": "application/json"
			},
			body: JSON.stringify({ image: file })
		});
		// Instead of sending the file string directly, wrap it in JSON.;
		//check if response is ok
		if (!resp) {
			DebugLogger.error("Failed to generate face", { toast: true });
			return;
		}
		const data = await resp.json();
		DebugLogger.debug("getHeadshot response", { data });
		//if data is not empty and greater than 1, find the face with the highest score and draw a rectangle around it
		if (data?.result && data?.result.length > 0) {
			const canvas = document.createElement("canvas");
			const ctx = canvas.getContext("2d");
			if (!ctx) return;
			const img = new Image();
			img.src = char.images.avatar;
			img.onload = () => {
				const padding = facePadding;
				const face = data.result.reduce((prev: { score: number }, current: { score: number }) =>
					prev.score > current.score ? prev : current
				);
				const { xmin, ymin, xmax, ymax } = face.box;
				const newXMin = Math.max(xmin - padding, 0);
				const newYMin = Math.max(ymin - padding, 0);
				const newWidth = Math.min(xmax - xmin + padding * 2, img.width - newXMin);
				const newHeight = Math.min(ymax - ymin + padding * 2, img.height - newYMin);
				canvas.width = newWidth;
				canvas.height = newHeight;
				ctx.drawImage(img, newXMin, newYMin, newWidth, newHeight, 0, 0, newWidth, newHeight);
				//char.images.face = canvas.toDataURL();
				//update CharacterSettingsStore with the new face image
				CharacterStore.update((c) => {
					c.images.face = canvas.toDataURL();
					return c;
				});
				DebugLogger.info("Face generated", { toast: true });
			};
		} else {
			DebugLogger.warn("No face found", { toast: true });
		}
	}
}
