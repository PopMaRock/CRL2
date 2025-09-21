//@ts-ignore - onnxruntime-web is a part of @transformers
import { InferenceSession, Tensor } from "onnxruntime-web";

/**
 * The format for a single tag result.
 */
export interface TagResult {
	/** The name of the tag. */
	label: string;
	/** The confidence score of the tag. */
	score: number;
	/** The category of the tag. */
	category?: "general" | "character" | "rating";
}

/**
 * Options for the getTags function.
 */
export interface TaggingOptions {
	/** URL to the ONNX model file. */
	modelUrl: string;
	/** URL to the labels CSV file. */
	labelsUrl: string;
	/** Threshold for general tags. Defaults to 0.35. */
	generalThreshold?: number;
	/** Threshold for character tags. Defaults to 0.85. */
	characterThreshold?: number;
	/** Whether to use MCut for the general tag threshold. Defaults to false. */
	useGeneralMcut?: boolean;
	/** Whether to use MCut for the character tag threshold. Defaults to false. */
	useCharacterMcut?: boolean;
}

const kaomojis = [
	"0_0",
	"(o)_(o)",
	"+_+",
	"+_-",
	"._.",
	"<o>_<o>",
	"<|>_<|>",
	"=_=",
	">_<",
	"3_3",
	"6_9",
	">_o",
	"@_@",
	"^_^",
	"o_o",
	"u_u",
	"x_x",
	"|_|",
	"||_||"
];

/**
 * Manages the WD-Tagger model and prediction logic.
 */
class WdTagger {
	private session: InferenceSession | null = null;
	private modelTargetSize: number = 0;

	private tagNames: string[] = [];
	private ratingIndexes: number[] = [];
	private generalIndexes: number[] = [];
	private characterIndexes: number[] = [];

	/**
	 * Initializes the tagger by loading the model and labels.
	 */
	public async init(modelUrl: string, labelsUrl: string): Promise<void> {
		try {
			if (!modelUrl || !labelsUrl) {
				throw new Error("Model URL and Labels URL must be provided.");
			}

			this.session = await InferenceSession.create(modelUrl, { executionProviders: ["wasm"] });

			// Hardcode the target size for wd-convnext-tagger-v3 (448x448 input)
			this.modelTargetSize = 448;

			await this.loadLabels(labelsUrl);
		} catch (e) {
			console.error("Failed to initialize WDTagger", e);
			this.session = null;
			throw e;
		}
	}

	/**
	 * Loads and parses the labels from the provided CSV file URL.
	 */
	private async loadLabels(labelsUrl: string): Promise<void> {
		const response = await fetch(labelsUrl, { credentials: "include" });
		if (!response.ok) {
			throw new Error(`Failed to fetch labels from ${labelsUrl}: ${response.statusText}`);
		}
		const csvText = await response.text();
		const lines = csvText.split("\n").filter((line) => line.trim() !== "");

		// Clear previous labels before loading new ones
		this.tagNames = [];
		this.ratingIndexes = [];
		this.generalIndexes = [];
		this.characterIndexes = [];

		const rows = lines.slice(1); // Skip header

		rows.forEach((row) => {
			const index = this.tagNames.length;
			// Correctly parse CSV row which may have quoted names
			const parts = row.match(/(?:"[^"]*"|[^,]+)/g);
			if (!parts || parts.length < 3) return; // Need at least id, name, category

			const name = parts[1].replace(/"/g, ""); // Name is in the second column
			const category = parseInt(parts[2], 10); // Category is in the third column

			if (!name || Number.isNaN(category)) return;

			const tagName = kaomojis.includes(name) ? name : name.replace(/_/g, " ");
			this.tagNames.push(tagName);

			switch (category) {
				case 0:
					this.generalIndexes.push(index);
					break;
				case 4:
					this.characterIndexes.push(index);
					break;
				case 9:
					this.ratingIndexes.push(index);
					break;
			}
		});
	}

	/**
	 * Decodes a base64 string into an HTMLImageElement.
	 */
	private base64ToImage(base64: string): Promise<HTMLImageElement> {
		return new Promise((resolve, reject) => {
			const img = new Image();
			img.onload = () => resolve(img);
			img.onerror = (err) => reject(new Error(`Failed to load image from base64: ${err}`));
			img.src = base64;
		});
	}

	/**
	 * Preprocesses the image for the model.
	 */
	private async preprocess(base64Image: string): Promise<Tensor> {
		const image = await this.base64ToImage(base64Image);
		const { width, height } = image;
		const targetSize = this.modelTargetSize;

		const canvas = document.createElement("canvas");
		canvas.width = targetSize;
		canvas.height = targetSize;
		const ctx = canvas.getContext("2d", { willReadFrequently: true });
		if (!ctx) throw new Error("Could not get 2D context from canvas");

		ctx.fillStyle = "white";
		ctx.fillRect(0, 0, targetSize, targetSize);

		const maxDim = Math.max(width, height);
		const padLeft = (maxDim - width) / 2;
		const padTop = (maxDim - height) / 2;

		const tempCanvas = document.createElement("canvas");
		tempCanvas.width = maxDim;
		tempCanvas.height = maxDim;
		const tempCtx = tempCanvas.getContext("2d");
		if (!tempCtx) throw new Error("Could not get 2D context from temporary canvas");

		tempCtx.fillStyle = "white";
		tempCtx.fillRect(0, 0, maxDim, maxDim);
		tempCtx.drawImage(image, padLeft, padTop);

		ctx.drawImage(tempCanvas, 0, 0, targetSize, targetSize);

		const imageData = ctx.getImageData(0, 0, targetSize, targetSize);
		const data = imageData.data;
		const float32Data = new Float32Array(targetSize * targetSize * 3);

		for (let i = 0, j = 0; i < data.length; i += 4, j += 3) {
			float32Data[j] = data[i + 2]; // Blue
			float32Data[j + 1] = data[i + 1]; // Green
			float32Data[j + 2] = data[i]; // Red
		}

		return new Tensor("float32", float32Data, [1, targetSize, targetSize, 3]);
	}

	/**
	 * Maximum Cut Thresholding (MCut).
	 */
	private mcutThreshold(probs: number[]): number {
		const sortedProbs = [...probs].sort((a, b) => b - a);
		if (sortedProbs.length <= 1) return 0.5;

		const diffs = sortedProbs.slice(0, -1).map((p, i) => p - sortedProbs[i + 1]);
		const t = diffs.indexOf(Math.max(...diffs));
		return (sortedProbs[t] + sortedProbs[t + 1]) / 2;
	}

	/**
	 * Generates tags for a given image.
	 */
	public async tagImage(base64Image: string, options: Omit<TaggingOptions, "modelUrl" | "labelsUrl">): Promise<TagResult[]> {
		if (!this.session) {
			throw new Error("Tagger is not initialized. Call init() first.");
		}

		const tensor = await this.preprocess(base64Image);

		const feeds = { [this.session.inputNames[0]]: tensor };
		const results = await this.session.run(feeds);
		const outputData = results[this.session.outputNames[0]].data as Float32Array;

		const allTags = this.tagNames.map((name, i) => ({ label: name, score: outputData[i] }));
		let finalTags: TagResult[] = [];

		// Process Ratings
		const ratingTags = this.ratingIndexes.map((i) => allTags[i]);
		if (ratingTags.length > 0) {
			const topRating = ratingTags.reduce((prev, current) => (prev.score > current.score ? prev : current));
			finalTags.push({ ...topRating, category: "rating" });
		}

		// Process General Tags
		let generalThresh = options.generalThreshold ?? 0.45;
		const generalTags = this.generalIndexes.map((i) => allTags[i]);
		if (options.useGeneralMcut) {
			generalThresh = this.mcutThreshold(generalTags.map((t) => t.score));
		}
		finalTags.push(...generalTags.filter((t) => t.score > generalThresh).map((t) => ({ ...t, category: "general" as const })));

		// Process Character Tags
		let characterThresh = options.characterThreshold ?? 0.85;
		const characterTags = this.characterIndexes.map((i) => allTags[i]);
		if (options.useCharacterMcut) {
			characterThresh = this.mcutThreshold(characterTags.map((t) => t.score));
			characterThresh = Math.max(0.15, characterThresh);
		}
		finalTags.push(
			...characterTags.filter((t) => t.score > characterThresh).map((t) => ({ ...t, category: "character" as const }))
		);

		return finalTags.sort((a, b) => b.score - a.score);
	}
}

// --- Singleton instance and exported function ---

let taggerInstance: WdTagger | null = null;
let initPromise: Promise<void> | null = null;

/**
 * Takes a base64 image and returns an array of relevant tags.
 * This function initializes a singleton instance of the tagger on its first run.
 * @param base64Image The image data as a base64 string.
 * @param options The configuration options for tagging.
 * @returns A promise that resolves to an array of tag results, sorted by score.
 */
export async function getTags(base64Image: string, options?: TaggingOptions): Promise<TagResult[]> {
	if (!options) options = { modelUrl: "", labelsUrl: "" };
	if (options.modelUrl === "" || options.labelsUrl === "") {
		console.warn("Using default model and labels URLs for WDTagger.");
		options.modelUrl = "http://localhost:5173/_models_cache/smilingwolf/wd-convnext-tagger-v3/model.onnx";
		options.labelsUrl = "http://localhost:5173/_models_cache/smilingwolf/wd-convnext-tagger-v3/selected_tags.csv";
	}
	//==== Check model exists and if not, download it ====
	const wdtaggerStatus = await checkTaggerModelExists(options.modelUrl);
	if (wdtaggerStatus === null) {
		throw new Error("Failed to check WDTagger model existence. Check console for details.");
	} else if (!wdtaggerStatus) {
		// download the model
		const response = await fetch("/api/transformers/download-wdtagger", { credentials: "include" });
		if (!response.ok) {
			throw new Error(`Failed to download WDTagger model: ${response.statusText}`);
		}
		console.log("WDTagger model downloaded successfully.");
	}
	//=====================================================

	if (!taggerInstance) {
		if (!initPromise) {
			// Only initialize if not already attempting
			const newTagger = new WdTagger();
			initPromise = newTagger
				.init(options.modelUrl, options.labelsUrl)
				.then(() => {
					taggerInstance = newTagger;
				})
				.catch((err) => {
					// Reset on failure to allow for a retry on the next call
					initPromise = null;
					throw err;
				});
		}
		await initPromise;
	}

	if (!taggerInstance) {
		throw new Error("Tagger initialization failed. Check the console for the original error.");
	}

	return taggerInstance.tagImage(base64Image, {
		generalThreshold: options.generalThreshold,
		characterThreshold: options.characterThreshold,
		useGeneralMcut: options.useGeneralMcut,
		useCharacterMcut: options.useCharacterMcut
	});
}

async function checkTaggerModelExists(modelUrl: string): Promise<boolean | null> {
	try {
		const response = await fetch(modelUrl, { credentials: "include" });
		return response.ok;
	} catch (error) {
		console.error("Error checking WDTagger model existence:", error);
		return null;
	}
}
