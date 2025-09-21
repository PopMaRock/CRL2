import module from "$lib/transformers/ssr/transformers";
import { DebugLogger } from "$lib/utilities/error-manager";
import { resp } from "$lib/utilities/apiHelper";
import type { RequestHandler } from "./$types";

export const POST: RequestHandler = async ({ request }) => {
	try {
		const { image: base64 } = await request.json();
		if (!base64 || typeof base64 !== "string") {
			return resp({ error: "Base64 image string is required" }, 400);
		}

		// Get a RawImage from the base64 string.
		const rawImage = await module.getRawImage(base64);
		if (!rawImage) {
			return resp({ error: "Failed to parse image - no rawimage" }, 400);
		}
		const result = await getTransformersFaceDetection(rawImage);
		return resp({ result }, 200);
	} catch (error: any) {
		DebugLogger.error("/api/transformers/facedetection", error);
		return resp({ error: "Failed to process request" }, 500);
	}
};

/**
 * Detects faces from the given RawImage.
 * @param rawImage - The RawImage obtained from the base64 string.
 * @returns {Promise<number[]>} - The face detection result.
 */
async function getTransformersFaceDetection(rawImage: unknown): Promise<number[]> {
	// Ensure we are using the face-detection pipeline.
	const pipe = await module.getPipeline("object-detection");
	// Pass the RawImage to the pipeline
	const result = await pipe(rawImage, { threshold: 0.2 });
	DebugLogger.debug("result", result);
	return result;
}
/* RETURNS:
      [
      {
          "score": 0.9801229238510132,
          "label": "LABEL_0",
          "box": {
              "xmin": 243,
              "ymin": 60,
              "xmax": 359,
              "ymax": 215
          }
      },
      {
          "score": 0.9890737533569336,
          "label": "LABEL_0",
          "box": {
              "xmin": 243,
              "ymin": 61,
              "xmax": 360,
              "ymax": 218
          }
      }
      ]
*/
