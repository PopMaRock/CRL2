import { AutoModel, AutoProcessor, RawImage } from "@huggingface/transformers";
import { browser } from "$app/environment";
import { DebugLogger } from "$lib/utilities/error-manager";
/* cspell:ignore briaai RMBG pretrained */
//These are functions that require canvas to function. They are not SSR compatible.

export async function removeBackgroundFromImage(image: any) {
	// Assuming "browser" is defined globally or imported appropriately
	if (browser) {
		// Obtain a raw image object (assumed to have properties: width, height, toCanvas(), etc.)
		const rawImage = await getRawImage(image);
		if (!rawImage) throw new Error("Failed to parse image - no rawimage");
		// Load the model and processor
		const model = await AutoModel.from_pretrained("briaai/RMBG-1.4");
		const processor = await AutoProcessor.from_pretrained("briaai/RMBG-1.4");
		// Preprocess the image using the processor
		const { pixel_values } = await processor(rawImage);
		// Predict the alpha matte using the model
		const { output } = await model({ input: pixel_values });
		// Convert the model's output to a mask image (resizing it to the original dimensions)
		const maskData = (await RawImage.fromTensor(output[0].mul(255).to("uint8")).resize(rawImage.width, rawImage.height)).data;
		// Create a new canvas with the same dimensions as the raw image
		const canvas = document.createElement("canvas");
		canvas.width = rawImage.width;
		canvas.height = rawImage.height;
		const ctx = canvas.getContext("2d");
		if (!ctx) {
			throw new Error("Failed to get 2D context from canvas.");
		}

		// Draw the original image on the canvas
		ctx.drawImage(rawImage.toCanvas(), 0, 0);

		// Get the image data from the canvas using the canvas dimensions.
		// (Replacing "img.width" with "canvas.width" and "canvas.height")
		const pixelData = ctx.getImageData(0, 0, canvas.width, canvas.height);

		// Update the alpha channel of each pixel using the mask data
		for (let i = 0; i < maskData.length; ++i) {
			// Every pixel has 4 components (r, g, b, a) so the alpha channel is at index 4 * i + 3.
			pixelData.data[4 * i + 3] = maskData[i];
		}
		ctx.putImageData(pixelData, 0, 0);
		DebugLogger.debug("removeBackgroundFromImage", {
			message: "Background removed successfully",
			image: canvas.toDataURL("image/png")
		});
		// Return the final image as a PNG data URL
		return canvas.toDataURL("image/png");
	}
}
async function getRawImage(image: string): Promise<RawImage | null> {
	try {
		const base64Data = image.startsWith("data:") ? image.split(",")[1] : image;
		const byteArray = base64ToUint8Array(base64Data);
    if(!byteArray) throw new Error("getRawImage: Not in browser environment or invalid base64 data");
		// Ensure we pass an ArrayBuffer, not ArrayBufferLike or SharedArrayBuffer
		const arrayBuffer = byteArray.buffer instanceof ArrayBuffer ? byteArray.buffer : new ArrayBuffer(byteArray.length);

		const blob = new Blob([arrayBuffer]);

		const rawImage = await RawImage.fromBlob(blob);
		if (!rawImage) throw new Error("Get RawImage. Failed to parse image - no rawimage");
		return rawImage;
	} catch (error) {
		console.error("Error in getRawImage:", error);
		return null;
	}
}
function base64ToUint8Array(base64: string): Uint8Array|null {
  if(browser){
			const binaryString = window.atob(base64);
			const len = binaryString.length;
			const bytes = new Uint8Array(len); // No type parameter!
			for (let i = 0; i < len; i++) {
				bytes[i] = binaryString.charCodeAt(i);
			}
			return bytes;
		}
  return null;
}
